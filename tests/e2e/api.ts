import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { TestApi } from "../fixtures/api-client";

declare global {
  interface Window {
    animicTest: TestApi;
  }
}

export async function loadApi(page: Page) {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.animicTest));
}

export async function connect(page: Page, code: string) {
  await page.evaluate((value) => window.animicTest.connect(value), code);
  await expect.poll(() => page.evaluate(() => window.animicTest.connection())).toBe("接続済み");
}

export async function create(page: Page, name = "ホスト") {
  await loadApi(page);
  const code = await page.evaluate(async (value) => {
    await window.animicTest.ensureParticipant();
    return window.animicTest.createRoom({ data: { name: value, requestId: crypto.randomUUID() } });
  }, name);
  expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  await connect(page, code);
  return code;
}

export async function join(page: Page, code: string, name: string) {
  await loadApi(page);
  await page.evaluate(
    async (data) => {
      await window.animicTest.ensureParticipant();
      await window.animicTest.joinRoom({ data });
    },
    { code, name },
  );
  await connect(page, code);
}

export async function snapshot(page: Page) {
  const room = await page.evaluate(() => window.animicTest.snapshot());
  if (!room) throw new Error("ルームの状態を取得していません。");
  return room;
}
