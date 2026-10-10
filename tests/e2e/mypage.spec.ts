import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { getBattleRecords } from "../../src/features/battle/battle-history";
import type { SavedBattleResult } from "../../src/features/battle/battle-history";
import { expectAccessible } from "../design-system/browser/accessibility";
import { create, join, loadApi, signIn, snapshot } from "./api";
import { executeLocalD1 } from "./d1";

const origin = "http://127.0.0.1:4173";
// 匿名参加の回数制限を、ほかのファイルのテストと分ける。
test.use({ reducedMotion: "reduce", extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.16" } });
test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg')",
  );
});

function sql(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

/** 保存済みの対戦結果と、参加者ごとの戦績をD1へ入れる。 */
async function saveResult(result: SavedBattleResult) {
  const records = getBattleRecords(result).map(
    (record) =>
      `(${[
        sql(record.battleId),
        sql(record.participantId),
        record.startedAt,
        sql(record.difficulty),
        record.participantCount,
        record.rank ?? "NULL",
        record.total ?? "NULL",
        record.imageUrl === null ? "NULL" : sql(record.imageUrl),
      ].join(", ")})`,
  );
  await executeLocalD1(
    `INSERT INTO battle_result (battle_id, room_code, data) VALUES (${sql(result.battleId)}, ${sql(result.roomCode)}, ${sql(JSON.stringify(result))}); INSERT INTO battle_record (battle_id, participant_id, started_at, difficulty, participant_count, rank, total, image_url) VALUES ${records.join(", ")}`,
  );
}

const illustration = (id: number) => `${origin}/images/account-icons/illustration-${id}.svg`;

/** 全員が提出し、`totals`の人が採点された対戦。 */
function scoredResult(
  participants: { id: string; name: string }[],
  totals: Record<string, number>,
  startedAt: number,
): SavedBattleResult {
  const scores = Object.entries(totals).map(([participantId, total]) => ({ participantId, total }));
  const best = Math.max(...scores.map((score) => score.total));
  return {
    battleId: crypto.randomUUID(),
    roomCode: "MYPAGE23",
    names: Object.fromEntries(participants.map(({ id, name }) => [id, name])),
    topic: { id: "e2e-topic", difficulty: "normal", imageUrl: illustration(8) },
    settings: { difficulty: "normal", durationSeconds: 90, selectionSeconds: 15 },
    participantIds: participants.map(({ id }) => id),
    submissions: participants.map(({ id }) => ({
      participantId: id,
      status: "submitted",
      generationId: `generation-${id}`,
      submittedAt: startedAt + 42_000,
      successfulGenerationCount: 3,
      eligibleForSpeedBonus: true,
    })),
    result: {
      kind: "win",
      reason: "higher-score",
      winnerId: scores.find((score) => score.total === best)?.participantId ?? "",
      decidedAt: startedAt + 60_000,
    },
    scores,
    startedAt,
    submittedImages: participants.map(({ id }, index) => ({
      id: `generation-${id}`,
      participantId: id,
      imageUrl: illustration(index + 1),
    })),
  };
}

/** 採点ワーカーが報告した指標を、採点ジョブとしてD1へ入れる。 */
async function saveScoringJob(battleId: string, participantId: string, total: number) {
  const id = crypto.randomUUID();
  const report = JSON.stringify({
    total,
    ccip: { skipped: "no person in one of the images", raw: 0.17 },
    pixai: { raw: 0.78, score: 74.8 },
    siglip2: { raw: 0.91, score: 71 },
    dinov2: { raw: 0.63, score: 88.5 },
    depth: { raw: 0.78, score: 67 },
  });
  const raw = JSON.stringify([{ nodeId: "3", label: "similarity", values: { text: [report] } }]);
  await executeLocalD1(
    `INSERT INTO scoring_job (id, battle_id, room_code, workflow_version, inputs, state, created_at, raw_result) VALUES (${sql(id)}, ${sql(battleId)}, 'MYPAGE23', 'illust-similarity-v2', '[]', 'succeeded', 0, ${sql(raw)}); INSERT INTO scoring_result (job_id, participant_id, total) VALUES (${sql(id)}, ${sql(participantId)}, ${total})`,
  );
}

async function history(page: Page) {
  return page.evaluate(() => window.animicTest.getMyBattleHistory());
}

test("ログインしていない人がトップの「マイページ」を押すと、移動する前にログインを求める", async ({
  page,
}) => {
  // 実際のサービスへは通信せず、ログインの開始で送る戻り先だけを確かめる。
  await page.route("https://accounts.google.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>Google</title>" }),
  );
  const loginRequest = page.waitForRequest("**/api/auth/sign-in/social");
  await page.goto("/");
  await page.getByRole("link", { name: "マイページ" }).click();
  const dialog = page.getByRole("dialog", { name: "ログインしよう" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(dialog.getByText("戦績を見るにはログインが必要です。")).toBeVisible();
  await dialog.getByRole("button", { name: "Googleでログイン" }).click();
  expect((await loginRequest).postDataJSON()).toMatchObject({ callbackURL: "/mypage" });
});

test("ログインしていれば、トップのメニューにアカウントのアイコンを出してマイページへ移る", async ({
  browser,
}) => {
  for (const provider of ["google", "discord"] as const) {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      await signIn(context, {
        provider,
        email: `${crypto.randomUUID()}@example.test`,
        name: provider === "google" ? "ぐーぐる" : "でぃすこ",
      });
      await page.goto("/");
      const link = page.getByRole("link", {
        name: `マイページ（${provider === "google" ? "ぐーぐる" : "でぃすこ"}）`,
      });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL("/mypage");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } finally {
      await context.close();
    }
  }
});

test("ログインしていない人と匿名の参加者には、ログインを案内する", async ({ page }) => {
  await page.goto("/mypage");
  const prompt = page.getByRole("heading", { name: "ログインして戦績を残そう" });
  await expect(prompt).toBeVisible();
  await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discordでログイン" })).toBeVisible();
  await expect(page.getByText("ログインしなくても遊べます。", { exact: false })).toBeVisible();
  await page.goto(`/mypage/matches/${crypto.randomUUID()}`);
  await expect(prompt).toBeVisible();

  await loadApi(page);
  await page.evaluate(() => window.animicTest.ensureParticipant());
  expect(await history(page)).toBeNull();
  await page.goto("/mypage");
  await expect(prompt).toBeVisible();
});

test("対戦の結果を、ログインして参加した人だけの戦績に残す", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const guestContext = await browser.newContext();
  try {
    const code = await create(page, "記録ホスト");
    const guest = await guestContext.newPage();
    await join(guest, code, "匿名の参加者");
    await expect
      .poll(async () => (await snapshot(page)).members.filter((member) => member.connected).length)
      .toBe(2);
    const started = await page.evaluate(
      async (data) => {
        await window.animicTest.setRoomSettings({ data });
        return window.animicTest.startBattle({ data });
      },
      {
        code,
        settings: { difficulty: "easy", durationSeconds: 1, selectionSeconds: 1 } as const,
        previousBattleId: null,
      },
    );
    expect(started.error).toBeNull();
    await expect
      .poll(async () => (await history(page))?.records.length, { timeout: 15_000 })
      .toBe(1);
    const saved = await history(page);
    expect(saved?.stats).toEqual({
      matches: 1,
      wins: 0,
      winRate: 0,
      bestTotal: null,
      averageTotal: null,
    });
    expect(saved?.records[0]).toMatchObject({
      difficulty: "easy",
      participantCount: 2,
      rank: null,
      total: null,
      imageUrl: null,
    });
    // 匿名で参加した人には戦績を返さない。
    expect(await history(guest)).toBeNull();

    await page.goto("/mypage");
    await page.getByRole("link", { name: "かんたん・2人対戦（順位なし）の詳細" }).click();
    await expect(page.getByRole("heading", { name: "戦績の詳細", level: 1 })).toBeVisible();
    await expect(page.getByText("NO GAME", { exact: false })).toBeVisible();
    const ranking = page.getByRole("list", { name: "この対戦の順位" });
    await expect(ranking.getByText("記録ホスト（あなた）")).toBeVisible();
    await expect(ranking.getByText("匿名の参加者")).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("成績・1位だけの絞り込み・詳細の内訳と指標を表示し、ほかの人の戦績は見せない", async ({
  page,
  browser,
}) => {
  const me = await signIn(page.context(), {
    provider: "discord",
    email: `${crypto.randomUUID()}@example.test`,
    name: "ねこぜ",
  });
  const otherContext = await browser.newContext();
  try {
    const other = await signIn(otherContext);
    const now = Date.now();
    const won = scoredResult(
      [
        { id: me, name: "ねこぜ" },
        { id: other, name: "ぴよ丸" },
      ],
      { [me]: 80, [other]: 61.2 },
      now - 3_600_000,
    );
    const lost = scoredResult(
      [
        { id: other, name: "ぴよ丸" },
        { id: me, name: "ねこぜ" },
        { id: crypto.randomUUID(), name: "ぴくせる侍" },
      ],
      { [me]: 70, [other]: 91 },
      now,
    );
    const others = scoredResult(
      [
        { id: other, name: "ぴよ丸" },
        { id: crypto.randomUUID(), name: "プロンプト職人" },
      ],
      { [other]: 50 },
      now,
    );
    for (const result of [won, lost, others]) await saveResult(result);
    await saveScoringJob(won.battleId, me, 80);

    await page.goto("/mypage");
    await expect(page.getByRole("heading", { name: "ねこぜ", level: 2 })).toBeVisible();
    await expect(page.getByText("Discordでログイン中")).toBeVisible();
    for (const [label, value] of [
      ["1位", "1回"],
      ["対戦", "2回"],
      ["勝率", "50%"],
      ["ベストスコア", "80.0pt"],
      ["平均の再現度", "75.0%"],
    ])
      await expect(page.getByText(label, { exact: true }).locator("..")).toContainText(value);
    const list = page.getByRole("list", { name: "戦績" });
    await expect(list.getByRole("link")).toHaveCount(2);
    await expect(list.getByRole("link").first()).toHaveAccessibleName(
      "ふつう・3人対戦（2位）の詳細",
    );
    await expectAccessible(new AxeBuilder({ page }).include("main"));
    await page.getByRole("radiogroup", { name: "戦績の絞り込み" }).getByText("1位だけ").click();
    await expect(list.getByRole("link")).toHaveCount(1);
    await list.getByRole("link", { name: "ふつう・2人対戦（1位）の詳細" }).click();

    await expect(page).toHaveURL(`/mypage/matches/${won.battleId}`);
    await expect(page.getByText("1st", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: "あなたの提出画像" })).toHaveAttribute(
      "src",
      illustration(1),
    );
    await expect(page.getByText("42秒")).toBeVisible();
    await expect(page.getByText("3回")).toBeVisible();
    await expect(page.getByRole("meter", { name: "タグ" })).toHaveAttribute(
      "aria-valuenow",
      "74.8",
    );
    await expect(page.getByRole("meter", { name: "画像の特徴" })).toBeVisible();
    await expect(page.getByText("採点の対象外")).toBeVisible();
    const ranking = page.getByRole("list", { name: "この対戦の順位" });
    await expect(ranking.getByRole("listitem").first()).toContainText("ねこぜ（あなた）");
    await expect(ranking.getByRole("listitem").nth(1)).toContainText("ぴよ丸");
    await expectAccessible(new AxeBuilder({ page }).include("main"));

    // ほかの人の対戦は、あるかどうかを知らせない。
    const response = await page.goto(`/mypage/matches/${others.battleId}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await loadApi(page);
    expect(
      await page.evaluate(
        (battleId) => window.animicTest.getMyBattleDetail({ data: { battleId } }),
        others.battleId,
      ),
    ).toBeNull();
  } finally {
    await otherContext.close();
  }
});

test("表示名とアイコンを変え、次に作るルームから使う", async ({ page }) => {
  await signIn(page.context());
  await page.goto("/mypage");
  await expect(page.getByText("まだ戦績がありません")).toBeVisible();
  await page.getByRole("button", { name: "表示名を変更" }).click();
  const name = page.getByRole("textbox", { name: "表示名" });
  await expect(name).toHaveValue("ホスト");
  await name.fill("あたらしい名前");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("heading", { name: "あたらしい名前", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "表示名を変更" })).toBeFocused();

  await page.getByRole("button", { name: "アイコンを変更" }).click();
  const dialog = page.getByRole("dialog", { name: "アイコンを変更" });
  await dialog.getByRole("button", { name: "イラスト 3" }).click();
  await expect(dialog.getByRole("button", { name: "イラスト 3" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dialog.getByRole("button", { name: "保存する" }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "アイコンを変更" }).locator("img")).toHaveAttribute(
    "src",
    "/images/account-icons/illustration-3.svg",
  );

  await page.goto("/start");
  await expect(page.getByRole("textbox", { name: "表示名" })).toHaveValue("あたらしい名前");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
  const players = page.getByRole("list", { name: "プレイヤー" });
  await expect(players.getByText("あたらしい名前")).toBeVisible();
  await expect(players.locator('img[src="/images/account-icons/illustration-3.svg"]')).toHaveCount(
    1,
  );
});
