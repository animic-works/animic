import { expect } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

import type { BattleSettings } from "../../src/features/battle/battle-state";

// 画面を操作するE2Eで共通に使う手順（トップからの作成・URLからの参加・条件の保存）

export async function createFromTop(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("link", { name: "スタート" }).first().click();
  await expect(page).toHaveURL("/start");
  await page.getByRole("textbox", { name: "表示名" }).fill(name);
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  await expect(page.getByRole("heading", { name: "ルール" })).toBeVisible();
  return new URL(page.url()).pathname.split("/").at(-1) ?? "";
}

export async function joinByUrl(browser: Browser, code: string, name: string) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`/rooms/${code.toLowerCase()}`);
  await expect(page).toHaveURL(`/rooms/${code}`);
  await expect(page.getByText(`ルーム ${code} に参加します`)).toBeVisible();
  await page.getByRole("textbox", { name: "表示名" }).fill(name);
  await page.getByRole("button", { name: "ルームに参加" }).click();
  await expect(page.getByRole("heading", { name: "ルール" })).toBeVisible();
  return { context, page };
}

/**
 * 画面の選択肢（60・90・120秒）にない制限時間を、検証用クライアントで保存する。
 * 開始時は画面に表示中の条件を送るため、保存した制限時間が画面に届く（どの選択肢も選ばれていない）のを待つ。
 */
export async function saveSettings(
  page: Page,
  code: string,
  settings: BattleSettings,
  previousBattleId: string | null,
) {
  await page.waitForFunction(() => Boolean(window.animicTest));
  await page.evaluate((data) => window.animicTest.setRoomSettings({ data }), {
    code,
    settings,
    previousBattleId,
  });
  await expect(
    page.getByRole("radiogroup", { name: "制限時間" }).getByRole("radio", { checked: true }),
  ).toHaveCount(0);
}
