import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { loadApi } from "./api";

const origin = "http://127.0.0.1:4173";
const participantSchema = v.object({
  id: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9-]+$/)),
  isAnonymous: v.literal(true),
});
const signInSchema = v.object({ token: v.string(), user: participantSchema });
const sessionSchema = v.object({ user: participantSchema });
const execFileAsync = promisify(execFile);

test("匿名セッションを同じブラウザで復元し、別のブラウザとは区別する", async ({
  page,
  context,
  browser,
}) => {
  const response = await context.request.post("/api/auth/sign-in/anonymous", {
    headers: { Origin: origin },
    data: {},
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const signedIn = v.parse(signInSchema, await response.json());
  const cookies = await context.cookies();
  expect(cookies).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "animic.session_token",
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
      }),
    ]),
  );

  const restored = await context.request.get("/api/auth/get-session");
  expect(restored.status()).toBe(200);
  expect(v.parse(sessionSchema, await restored.json()).user.id).toBe(signedIn.user.id);

  const document = await page.goto("/");
  const html = await document?.text();
  expect(html).not.toContain(signedIn.user.id);
  expect(html).not.toContain(signedIn.token);
  await loadApi(page);
  const participant = await page.evaluate(() => window.animicTest.getCurrentParticipant());
  expect(participant).toEqual({ id: signedIn.user.id, isAnonymous: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Animic", exact: true })).toBeVisible();

  const other = await browser.newContext({ baseURL: origin });
  try {
    expect(await (await other.request.get("/api/auth/get-session")).json()).toBeNull();
    const otherSignIn = await other.request.post("/api/auth/sign-in/anonymous", {
      headers: { Origin: origin },
      data: {},
    });
    expect(otherSignIn.status()).toBe(200);
    expect(v.parse(signInSchema, await otherSignIn.json()).user.id).not.toBe(signedIn.user.id);
  } finally {
    await other.close();
  }
});

test("別Originからの匿名セッション作成を拒否する", async ({ request }) => {
  const response = await request.post("/api/auth/sign-in/anonymous", {
    headers: { Origin: "https://untrusted.example", "Sec-Fetch-Site": "cross-site" },
    data: {},
  });
  expect(response.status()).toBe(403);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test("失効したセッションは保存済みのCookieを再送しても復元できない", async ({
  context,
  browser,
}) => {
  const signedIn = await context.request.post("/api/auth/sign-in/anonymous", {
    headers: { Origin: origin },
    data: {},
  });
  expect(signedIn.status()).toBe(200);
  const oldCookies = await context.cookies();
  const signedOut = await context.request.post("/api/auth/sign-out", {
    headers: { Origin: origin },
    data: {},
  });
  expect(signedOut.status()).toBe(200);

  const replay = await browser.newContext({ baseURL: origin });
  try {
    await replay.addCookies(oldCookies);
    const response = await replay.request.get("/api/auth/get-session");
    expect(response.status()).toBe(200);
    expect(await response.json()).toBeNull();
  } finally {
    await replay.close();
  }
});

test("Cookieが残っていてもD1上で期限切れなら復元できない", async ({ context }) => {
  const response = await context.request.post("/api/auth/sign-in/anonymous", {
    headers: { Origin: origin },
    data: {},
  });
  expect(response.status()).toBe(200);
  const signedIn = v.parse(signInSchema, await response.json());
  await execFileAsync("vp", [
    "exec",
    "wrangler",
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    ".wrangler/e2e",
    "--command",
    `UPDATE session SET expires_at = 0 WHERE user_id = '${signedIn.user.id}'`,
  ]);
  const expired = await context.request.get("/api/auth/get-session");
  expect(expired.status()).toBe(200);
  expect(await expired.json()).toBeNull();
});

test("同じ回線から4人が同時に匿名参加できる", async ({ browser }) => {
  const contexts = await Promise.all(
    Array.from({ length: 4 }, () => browser.newContext({ baseURL: origin })),
  );
  try {
    const participants = await Promise.all(
      contexts.map(async (context) => {
        const response = await context.request.post("/api/auth/sign-in/anonymous", {
          headers: { Origin: origin },
          data: {},
        });
        expect(response.status()).toBe(200);
        return v.parse(signInSchema, await response.json()).user.id;
      }),
    );
    expect(new Set(participants).size).toBe(4);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
