import { expect, test } from "@playwright/test";
import { openLobby } from "../fixtures/room-presentation";
import { executeLocalD1 } from "./d1";

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg'); DELETE FROM rate_limit",
  );
});

test("ルールと準備状態を同期し、画面から開始・結果・再戦へ進める", async ({ page, browser }) => {
  test.setTimeout(60000);
  const guestContext = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const guest = await guestContext.newPage();
    const code = await openLobby(page, guest);
    await guest.goto(`/rooms/${code}`);
    await expect(guest.getByRole("button", { name: "準備完了にする", exact: true })).toBeVisible();
    await page
      .getByRole("radiogroup", { name: "制限時間" })
      .getByText("60秒", { exact: true })
      .click();
    await expect(guest.getByText("60秒", { exact: true })).toBeVisible();
    await guest.getByRole("button", { name: "準備完了にする", exact: true }).click();
    await expect(
      guest.getByRole("button", { name: "準備完了を取り消す", exact: true }),
    ).toBeVisible();
    // 保存の通信失敗から復旧した後も、選び直しを強制せず開始できる。
    await page.route("**/_serverFn/**", (route) => route.abort("failed"), { times: 1 });
    await page
      .getByRole("radiogroup", { name: "難易度" })
      .getByText("ふつう", { exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("ルールを保存できませんでした");
    await expect(
      page
        .getByRole("radiogroup", { name: "難易度" })
        .getByRole("radio", { name: "かんたん", exact: true }),
    ).toBeChecked();
    const settings = { difficulty: "easy", durationSeconds: 4, selectionSeconds: 2 } as const;
    await page.evaluate((data) => window.animicTest.setRoomSettings({ data }), {
      code,
      settings,
      previousBattleId: null,
    });
    await expect(
      page
        .getByRole("radiogroup", { name: "制限時間" })
        .getByRole("radio", { name: "4秒", exact: true }),
    ).toBeChecked();
    await page.getByRole("button", { name: "対戦をはじめる", exact: true }).click();
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("timer")).toBeVisible();
      await expect(
        participant.getByRole("button", { name: "この1枚で提出", exact: true }),
      ).toBeDisabled();
    }
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("heading", { name: "NO GAME", exact: true })).toBeVisible({
        timeout: 15000,
      });
    }
    await page.getByRole("button", { name: "同じメンバーで再戦", exact: true }).click();
    await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
    await expect(guest.getByRole("heading", { name: "NO GAME", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "対戦をはじめる", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "全員の準備がまだです", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "このままはじめる", exact: true }).click();
    for (const participant of [page, guest])
      await expect(participant.getByRole("timer")).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("ホストが退出するとトップへ戻り、残った参加者にホストを引き継ぐ", async ({
  page,
  browser,
}) => {
  const guestContext = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const guest = await guestContext.newPage();
    const code = await openLobby(page, guest);
    await guest.goto(`/rooms/${code}`);
    await expect(guest.getByRole("button", { name: "準備完了にする", exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "退出", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByRole("dialog", { name: "ルームを出ますか？", exact: true })
      .getByRole("button", { name: "退出する", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(guest.getByRole("button", { name: "対戦をはじめる", exact: true })).toBeVisible();
    await expect(guest.getByRole("button", { name: "対戦をはじめる", exact: true })).toBeDisabled();
  } finally {
    await guestContext.close();
  }
});
