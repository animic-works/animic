import { expect, type Page } from "@playwright/test";
import type { BattleSettings } from "../../src/features/battle/battle-state";
import { create, join, snapshot } from "../e2e/api";

/** 表示の検証にも実際の匿名参加・ルームAPI・WebSocketを使う。 */
export async function openLobby(page: Page, guest?: Page) {
  const code = await create(page, "操作確認");
  if (guest) {
    await join(guest, code, "ぴよ丸");
    await expect
      .poll(async () => (await snapshot(page)).members.filter((member) => member.connected).length)
      .toBe(2);
  }
  await page.goto(`/rooms/${code}`);
  await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
  await page.waitForFunction(() => Boolean(window.animicTest));
  await expect
    .poll(async () =>
      page.evaluate(async (value) => {
        const entry = await window.animicTest.getRoomEntry({ data: { code: value } });
        return entry.room?.settings != null;
      }, code),
    )
    .toBe(true);
  return code;
}

export async function openBattle(
  page: Page,
  guest: Page,
  settings: BattleSettings = { difficulty: "easy", durationSeconds: 120, selectionSeconds: 15 },
) {
  const code = await openLobby(page, guest);
  await page.waitForFunction(() => Boolean(window.animicTest));
  const result = await page.evaluate(
    async (data) => {
      await window.animicTest.setRoomSettings({ data });
      return window.animicTest.startBattle({ data });
    },
    { code, settings, previousBattleId: null },
  );
  expect(result.error).toBeNull();
  return code;
}
