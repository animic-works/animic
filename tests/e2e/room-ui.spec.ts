import { expect, test } from "@playwright/test";
import { openLobby } from "../fixtures/room-presentation";
import { signIn } from "./api";
import { executeLocalD1 } from "./d1";

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg'); DELETE FROM rate_limit",
  );
});

test("ルールと準備状態を同期し、同じルームで3戦目以降も再戦できる", async ({ page, browser }) => {
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
    for (let round = 3; round <= 4; round += 1) {
      for (const participant of [page, guest]) {
        await expect(
          participant.getByRole("heading", { name: "NO GAME", exact: true }),
        ).toBeVisible({
          timeout: 15000,
        });
        await participant.getByRole("button", { name: "同じメンバーで再戦", exact: true }).click();
        await expect(participant).toHaveURL(new RegExp(`/rooms/${code}$`));
      }
      await page
        .getByRole("radiogroup", { name: "難易度" })
        .getByText("ふつう", { exact: true })
        .click();
      await expect(guest.getByText("ふつう", { exact: true })).toBeVisible();
      await page
        .getByRole("radiogroup", { name: "難易度" })
        .getByText("かんたん", { exact: true })
        .click();
      await expect(guest.getByText("かんたん", { exact: true })).toBeVisible();
      await guest.getByRole("button", { name: "準備完了にする", exact: true }).click();
      await expect(
        guest.getByRole("button", { name: "準備完了を取り消す", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "対戦をはじめる", exact: true }).click();
      for (const participant of [page, guest])
        await expect(participant.getByRole("timer")).toBeVisible();
    }
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

test("ロビーから戻ろうとすると退出の確認を出し、やめればロビーに残り、退出すれば戻る", async ({
  page,
}) => {
  await signIn(page.context());
  await page.goto("/");
  await page.getByRole("button", { name: "スタート", exact: true }).first().click();
  await page.getByRole("button", { name: "ルームを作る", exact: true }).click();
  const heading = page.getByRole("heading", { name: "ルームコード", exact: true });
  await expect(heading).toBeVisible();
  const room = page.url();
  const dialog = page.getByRole("dialog", { name: "ルームを出ますか？", exact: true });

  await page.goBack();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "やめる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(room);
  await expect(heading).toBeVisible();

  await page.goBack();
  await dialog.getByRole("button", { name: "退出する", exact: true }).click();
  await expect(page).toHaveURL(/\/start$/);
});

test("ロビーは狭い画面のヘッダーにルームコードを重ねず、広い欄でもお題の見本を正方形で見せる", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const code = await openLobby(page);
  const header = page.locator("header").first();
  await expect(header.getByRole("button", { name: "退出" })).toBeVisible();
  await expect(header.getByText(code)).toHaveCount(0);
  // ルームコードは、すぐ下のプレイヤーの欄で確かめられる。
  await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();

  for (const [width, height] of [
    [768, 1024],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    const topic = page.getByRole("img", { name: /お題のイメージ/ });
    await topic.scrollIntoViewIfNeeded();
    const box = (await topic.boundingBox())!;
    expect(Math.abs(box.width - box.height)).toBeLessThan(2);
  }
});
