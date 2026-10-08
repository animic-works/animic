import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { e2eAdminPassword } from "./admin-password";

/** 管理画面にパスワードでログインし、お題の一覧を開く。 */
export async function loginAdmin(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("パスワード").fill(e2eAdminPassword);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("navigation", { name: "管理メニュー" })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/topics$/);
}

/** 管理メニューから画面を開く。 */
export async function openAdminMenu(page: Page, name: string) {
  await page.getByRole("navigation", { name: "管理メニュー" }).getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}
