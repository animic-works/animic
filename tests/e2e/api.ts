import { expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import * as v from "valibot";

import type { TestApi } from "../fixtures/api-client";

declare global {
  interface Window {
    animicTest: TestApi;
  }
}

const signInSchema = v.object({ user: v.object({ id: v.string() }) });

/** E2E専用のログイン（src/lib/auth-e2e.server.ts）で、OAuthを通さずにログインした状態を作る。 */
export async function signIn(
  context: BrowserContext,
  account: { provider: "google" | "discord"; email: string; name: string } = {
    provider: "google",
    email: `${crypto.randomUUID()}@example.test`,
    name: "ホスト",
  },
) {
  const response = await context.request.post("/api/auth/sign-in/e2e", {
    headers: { Origin: "http://127.0.0.1:4173" },
    data: account,
  });
  expect(response.status()).toBe(200);
  return v.parse(signInSchema, await response.json()).user.id;
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
  // ルームを作れるのはログインした参加者だけ。
  await signIn(page.context());
  await loadApi(page);
  const code = await page.evaluate(
    (value) =>
      window.animicTest.createRoom({ data: { name: value, requestId: crypto.randomUUID() } }),
    name,
  );
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
