import { test, expect } from "@playwright/test";
import { create, signIn } from "./api";
import { executeLocalD1 } from "./d1";

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => {
  await executeLocalD1("DELETE FROM rate_limit");
});

test("ルームURLで参加し、名前と役割はサーバーの参加状態から復元する", async ({ page, browser }) => {
  const hostContext = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const host = await hostContext.newPage();
    const code = await create(host, "ホスト");
    await page.goto(`/rooms/${code.toLowerCase()}`);
    await expect(page).toHaveURL(new RegExp(`/rooms/${code}$`));
    await page.getByRole("button", { name: "ログインせずに進む", exact: true }).click();
    await page.getByRole("textbox", { name: "表示名" }).fill("参加者");
    await page.getByRole("button", { name: "ルームに参加", exact: true }).click();
    await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "対戦をはじめる", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "準備完了にする", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "表示名" })).toHaveCount(0);
    await page.getByRole("button", { name: "招待する", exact: true }).first().click();
    await expect(page.getByRole("dialog").getByRole("textbox")).toHaveValue(
      new RegExp(`/rooms/${code}$`),
    );
  } finally {
    await hostContext.close();
  }
});

test("ログイン中はトップのスタートから作成画面へ進む", async ({ page }) => {
  await signIn(page.context());
  await page.goto("/");
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  await page.getByRole("button", { name: "スタート", exact: true }).last().click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("textbox", { name: "表示名", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "表示名", exact: true }).fill("表示名");
  await expect(page.getByRole("button", { name: "ルームを作る", exact: true })).toBeEnabled();
});
