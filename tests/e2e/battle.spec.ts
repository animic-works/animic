import * as v from "valibot";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { BattleSnapshot, BattleSettings } from "../../src/features/battle/battle-state";
import { connect, create, join, loadApi, snapshot } from "./api";
import { executeLocalD1 } from "./d1";

async function battle(page: Page): Promise<BattleSnapshot> {
  const current = (await snapshot(page)).battle;
  if (!current) throw new Error("対戦が開始されていません。");
  return current;
}

async function start(
  page: Page,
  code: string,
  settings: BattleSettings,
  previousBattleId: string | null = null,
) {
  return page.evaluate(
    async (data) => {
      await window.animicTest.setRoomSettings({ data });
      return window.animicTest.startBattle({ data });
    },
    { code, settings, previousBattleId },
  );
}

test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg')",
  );
});

test("接続中の2人で開始し、開始時に切断していた人は復帰しても対戦に加えない", async ({
  page,
  browser,
}) => {
  const guestContext = await browser.newContext();
  const lateContext = await browser.newContext();
  const settings: BattleSettings = {
    difficulty: "easy",
    durationSeconds: 120,
    selectionSeconds: 60,
  };
  try {
    const code = await create(page, "開始担当");
    expect((await start(page, code, settings)).error).not.toBeNull();
    const guest = await guestContext.newPage();
    await join(guest, code, "参加者");
    await expect
      .poll(async () => (await snapshot(page)).members.filter((member) => member.connected).length)
      .toBe(2);
    const unauthorized = await guest.evaluate((data) => window.animicTest.startBattle({ data }), {
      code,
      settings,
      previousBattleId: null,
    });
    expect(unauthorized.error).not.toBeNull();
    const late = await lateContext.newPage();
    await join(late, code, "待機参加者");
    const lateId = await late.evaluate(
      async () => (await window.animicTest.getCurrentParticipant())?.id,
    );
    await expect.poll(async () => (await snapshot(page)).members.length).toBe(3);
    expect((await start(page, code, settings)).error).not.toBeNull();
    await late.close();
    await expect
      .poll(async () => (await snapshot(page)).members.filter((member) => member.connected).length)
      .toBe(2);
    expect((await start(page, code, settings)).error).toBeNull();
    await expect.poll(async () => (await snapshot(guest)).battle?.participantIds.length).toBe(2);
    const initial = await battle(page);
    expect(initial.generationEndsAt - initial.startedAt).toBe(120_000);
    expect(initial.participantIds).not.toContain(lateId);
    for (const participant of [page, guest]) {
      const current = await battle(participant);
      expect(current.id).toBe(initial.id);
      expect(current.topic.imageUrl).toBe("https://example.invalid/animic-topic.svg");
      expect(current.generationClosed).toBe(false);
    }
    await loadApi(page);
    await connect(page, code);
    expect((await battle(page)).id).toBe(initial.id);
    expect((await battle(page)).generationEndsAt).toBe(initial.generationEndsAt);
    const returned = await lateContext.newPage();
    await loadApi(returned);
    await connect(returned, code);
    expect((await battle(returned)).participantIds).not.toContain(lateId);
    expect((await battle(returned)).myGenerations).toEqual([]);
    const submitted = await returned.evaluate(
      async (data) => {
        try {
          await window.animicTest.submitBattleImage({
            data: { ...data, generationId: crypto.randomUUID() },
          });
          return true;
        } catch {
          return false;
        }
      },
      { code, battleId: initial.id },
    );
    expect(submitted).toBe(false);
  } finally {
    await guestContext.close();
    await lateContext.close();
  }
});

test("勝負不成立後に再戦し、前の結果のD1保存も再試行する", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const guestContext = await browser.newContext();
  await executeLocalD1(
    "CREATE TRIGGER e2e_reject_result BEFORE INSERT ON battle_result BEGIN SELECT RAISE(FAIL, 'e2e storage failure'); END",
  );
  try {
    const code = await create(page, "期限確認");
    const guest = await guestContext.newPage();
    await join(guest, code, "期限参加者");
    await expect
      .poll(async () => (await snapshot(page)).members.filter((member) => member.connected).length)
      .toBe(2);
    expect(
      (await start(page, code, { difficulty: "easy", durationSeconds: 2, selectionSeconds: 5 }))
        .error,
    ).toBeNull();
    const previousBattleId = (await battle(page)).id;
    await expect
      .poll(async () => (await battle(page)).generationClosed, { timeout: 8000 })
      .toBe(true);
    expect((await battle(page)).selectionEndsAt).not.toBeNull();
    for (const participant of [page, guest]) {
      await expect
        .poll(async () => (await battle(participant)).mySubmission?.status, { timeout: 8000 })
        .toBe("not-submitted");
      expect((await battle(participant)).submissionsClosed).toBe(true);
      expect((await battle(participant)).result?.kind).toBe("no-contest");
    }
    const settings: BattleSettings = {
      difficulty: "easy",
      durationSeconds: 120,
      selectionSeconds: 10,
    };
    const unauthorized = await guest.evaluate((data) => window.animicTest.startBattle({ data }), {
      code,
      settings,
      previousBattleId,
    });
    expect(unauthorized.error).not.toBeNull();
    expect((await start(page, code, settings, previousBattleId)).error).toBeNull();
    for (const participant of [page, guest]) {
      await expect.poll(async () => (await battle(participant)).id).not.toBe(previousBattleId);
      const current = await battle(participant);
      expect(current.settings.durationSeconds).toBe(120);
      expect(current.result).toBeNull();
      expect(current.myGenerations).toEqual([]);
      expect(current.mySubmission).toBeNull();
    }
    await executeLocalD1("DROP TRIGGER e2e_reject_result");
    const countSchema = v.array(v.object({ count: v.number() }));
    await expect
      .poll(
        async () => {
          try {
            const rows = v.parse(
              countSchema,
              await executeLocalD1(
                `SELECT count(*) AS count FROM battle_result WHERE room_code = '${code}' AND json_extract(data, '$.result.kind') = 'no-contest'`,
              ),
            );
            return rows[0]?.count;
          } catch (error) {
            // 別プロセスのWranglerとpreviewが同じローカルSQLiteを開く。
            if (error instanceof Error && error.message.includes("SQLITE_BUSY")) return undefined;
            throw error;
          }
        },
        { timeout: 45_000, intervals: [1000, 5000] },
      )
      .toBe(1);
    await loadApi(page);
    await connect(page, code);
    expect((await battle(page)).settings.durationSeconds).toBe(120);
    expect((await battle(page)).result).toBeNull();
  } finally {
    await executeLocalD1("DROP TRIGGER IF EXISTS e2e_reject_result");
    await guestContext.close();
  }
});
