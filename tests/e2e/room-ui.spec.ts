import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// 匿名参加の回数制限は送信元IPごとに数える。ほかのテストの参加回数と合算されないよう、送信元を分ける
const ip = (n: number) => ({ extraHTTPHeaders: { "CF-Connecting-IP": `203.0.113.${n}` } });
test.use(ip(10));

// 画面遷移の演出は視差効果を減らす設定で省き、操作の確認に集中する
test.use({ reducedMotion: "reduce" });

async function enterName(page: Page, name: string) {
  await expect(page.getByRole("heading", { name: "ログインしてはじめよう" })).toBeVisible();
  await page.getByRole("button", { name: "ログインせずに進む" }).click();
  await expect(page.getByRole("heading", { name: "表示名を決めよう" })).toBeVisible();
  await page.getByLabel("表示名", { exact: true }).fill(name);
}

test("画面からルームを作り、招待URLから参加して準備状態を同期する", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/rooms/new");
  await expect(page.getByRole("heading", { name: "ログインしてはじめよう" })).toBeVisible();
  await page.getByRole("button", { name: "ログインせずに進む" }).click();
  const create = page.getByRole("button", { name: "ルームを作る" });
  await expect(create).toBeDisabled();
  await page.getByLabel("表示名", { exact: true }).fill("  ホスト  ");
  await create.click();
  await expect(page).toHaveURL(/\/rooms\/[23456789A-HJKMNP-Z]{8}$/, { timeout: 15_000 });
  const code = new URL(page.url()).pathname.split("/").pop() ?? "";
  await expect(page.getByRole("group", { name: `ルームコード ${code}` })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "接続済み" })).toHaveCount(1);
  await expect(page.getByText("ホスト（あなた）")).toBeVisible();
  await expect(page.getByText("準備OK 1 / 1人")).toBeVisible();
  await expect(page.getByRole("button", { name: "対戦をはじめる" })).toBeDisabled();

  const guestContext = await browser.newContext({ ...ip(11), reducedMotion: "reduce" });
  try {
    const guest = await guestContext.newPage();
    // 小文字のコードでも大文字のURLへそろえて開く
    await guest.goto(`/rooms/${code.toLowerCase()}`);
    await expect(guest).toHaveURL(`/rooms/${code}`);
    await expect(guest.getByText(`ルーム ${code} に参加します`)).toBeVisible();
    await enterName(guest, "ゲスト");
    await guest.getByRole("button", { name: "ルームに参加" }).click();
    await expect(guest.getByText("ゲスト", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(guest.getByText("あなた", { exact: true })).toBeVisible();
    await expect(guest.getByText("ホストが開始します")).toBeVisible();
    await expect(page.getByText("準備OK 1 / 2人")).toBeVisible();
    await expect(page.getByRole("button", { name: "対戦をはじめる" })).toBeEnabled();

    // 自分の枠から表示名を変えると、ホストの画面にも反映される。ほかの人の枠には変更のボタンがない
    await expect(page.getByRole("button", { name: "表示名を変更" })).toHaveCount(1);
    await guest.getByRole("button", { name: "表示名を変更" }).click();
    const rename = guest.getByRole("dialog", { name: "表示名を変更" });
    const apply = rename.getByRole("button", { name: "変更する" });
    await expect(rename.getByLabel("表示名", { exact: true })).toHaveValue("ゲスト");
    await expect(apply).toBeDisabled();
    await rename.getByLabel("表示名", { exact: true }).fill("  ゲスト2  ");
    await apply.click();
    await expect(rename).toBeHidden();
    await expect(guest.getByText("ゲスト2", { exact: true })).toBeVisible();
    await expect(page.getByText("ゲスト2", { exact: true })).toBeVisible();

    await guest.getByRole("button", { name: "準備完了にする" }).click();
    await expect(guest.getByRole("button", { name: "準備完了を取り消す" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText("準備OK 2 / 2人")).toBeVisible();

    await guest.getByRole("button", { name: "退出" }).click();
    await guest.getByRole("button", { name: "退出する" }).click();
    await expect(guest).toHaveURL(/\/(#top)?$/);
    await expect(page.getByText("ゲスト2", { exact: true })).toHaveCount(0);
    await expect(page.getByText("準備OK 1 / 1人")).toBeVisible();
  } finally {
    await guestContext.close();
  }
  expect(errors).toEqual([]);
});

test("招待の窓でリンクとQRコードを見せる", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/rooms/new");
  await enterName(page, "ホスト");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[23456789A-HJKMNP-Z]{8}$/, { timeout: 15_000 });
  const code = new URL(page.url()).pathname.split("/").pop() ?? "";
  await page.getByRole("button", { name: "招待する" }).first().click();
  const dialog = page.getByRole("dialog", { name: "友だちを招待" });
  await expect(dialog.getByLabel("ルームURL", { exact: true })).toHaveValue(
    new RegExp(`/rooms/${code}$`),
  );
  await expect(dialog.getByRole("img", { name: "ルームURLのQRコード" })).toBeVisible();
  await dialog.getByRole("button", { name: "リンクをコピー" }).click();
  await expect(dialog.getByRole("button", { name: "コピーしました" })).toBeVisible();
  await dialog.getByRole("button", { name: "閉じる" }).click();
  await expect(dialog).toBeHidden();
});

test("狭い画面でも参加画面とロビーが横にはみ出さない", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/rooms/new");
  await expect(page.getByRole("button", { name: "ログインせずに進む" })).toBeVisible();
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fits()).toBe(true);
  await enterName(page, "ホスト");
  expect(await fits()).toBe(true);
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page.getByRole("button", { name: "対戦をはじめる" })).toBeVisible({
    timeout: 15_000,
  });
  expect(await fits()).toBe(true);
});
