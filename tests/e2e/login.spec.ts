import { expect, test } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import * as v from "valibot";

import { connect, create, loadApi, snapshot } from "./api";
import { executeLocalD1 } from "./d1";
import { e2eOAuthClients } from "./oauth-clients";

const origin = "http://127.0.0.1:4173";
const socialSchema = v.object({ url: v.pipe(v.string(), v.url()), redirect: v.literal(false) });
const signInSchema = v.object({ user: v.object({ id: v.string() }) });

// 認証APIは送信元のIPごとに回数を数えるため、ほかのテストファイルの匿名参加と合算させない。
test.use({ extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.10" } });

async function startSocial(context: BrowserContext, provider: "google" | "discord") {
  const response = await context.request.post("/api/auth/sign-in/social", {
    headers: { Origin: origin },
    data: { provider, callbackURL: "/start", errorCallbackURL: "/start", disableRedirect: true },
  });
  expect(response.status()).toBe(200);
  return new URL(v.parse(socialSchema, await response.json()).url);
}

// E2E専用のログイン（src/lib/auth-e2e.server.ts）で、OAuthを通さずにログインした状態を作る。
async function signIn(
  context: BrowserContext,
  account: { provider: "google" | "discord"; email: string; name: string },
) {
  const response = await context.request.post("/api/auth/sign-in/e2e", {
    headers: { Origin: origin },
    data: account,
  });
  expect(response.status()).toBe(200);
  return v.parse(signInSchema, await response.json()).user.id;
}

test("ログインの開始で各サービスの認証URLを返し、取り消したら理由を付けて戻り先へ戻す", async ({
  context,
}) => {
  const google = await startSocial(context, "google");
  expect(`${google.origin}${google.pathname}`).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  expect(google.searchParams.get("client_id")).toBe(e2eOAuthClients.google.id);
  expect(google.searchParams.get("redirect_uri")).toBe(`${origin}/api/auth/callback/google`);
  expect(google.searchParams.get("prompt")).toBe("select_account");

  // 認証画面で取り消すと、サービスはerror=access_deniedを付けてコールバックへ戻す。
  const canceled = await context.request.get(
    `/api/auth/callback/google?state=${google.searchParams.get("state")}&error=access_denied`,
    { maxRedirects: 0 },
  );
  expect(canceled.status()).toBe(302);
  const location = new URL(canceled.headers().location ?? "", origin);
  expect(`${location.origin}${location.pathname}`).toBe(`${origin}/start`);
  expect(location.searchParams.get("error")).toBe("access_denied");

  const discord = await startSocial(context, "discord");
  expect(`${discord.origin}${discord.pathname}`).toBe("https://discord.com/api/oauth2/authorize");
  expect(discord.searchParams.get("client_id")).toBe(e2eOAuthClients.discord.id);
  expect(discord.searchParams.get("redirect_uri")).toBe(`${origin}/api/auth/callback/discord`);
});

test("別Originからのログインの開始と、外部のURLへの戻り先を拒否する", async ({ request }) => {
  const foreign = await request.post("/api/auth/sign-in/social", {
    headers: { Origin: "https://untrusted.example", "Sec-Fetch-Site": "cross-site" },
    data: { provider: "google", callbackURL: "/start", disableRedirect: true },
  });
  expect(foreign.status()).toBe(403);
  const external = await request.post("/api/auth/sign-in/social", {
    headers: { Origin: origin },
    data: { provider: "google", callbackURL: "https://untrusted.example/", disableRedirect: true },
  });
  expect(external.status()).toBe(403);
});

test("ログイン中はアカウントの名前と最後に使ったサービスを返し、ログアウトはそのブラウザだけに効く", async ({
  page,
  context,
  browser,
}) => {
  const email = `${crypto.randomUUID()}@example.test`;
  const userId = await signIn(context, { provider: "google", email, name: "ねこぜ" });
  await loadApi(page);
  expect(await page.evaluate(() => window.animicTest.getCurrentParticipant())).toEqual({
    id: userId,
    isAnonymous: false,
    account: { name: "ねこぜ", provider: "google" },
  });

  const other = await browser.newContext({
    baseURL: origin,
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.10" },
  });
  try {
    expect(await signIn(other, { provider: "discord", email, name: "ねこぜ" })).toBe(userId);
    const otherPage = await other.newPage();
    await loadApi(otherPage);
    expect(await otherPage.evaluate(() => window.animicTest.getCurrentParticipant())).toEqual({
      id: userId,
      isAnonymous: false,
      account: { name: "ねこぜ", provider: "discord" },
    });
  } finally {
    await other.close();
  }

  const signedOut = await context.request.post("/api/auth/sign-out", {
    headers: { Origin: origin },
    data: {},
  });
  expect(signedOut.status()).toBe(200);
  expect(await page.evaluate(() => window.animicTest.getCurrentParticipant())).toBeNull();
  expect(
    await executeLocalD1(`SELECT count(*) AS count FROM session WHERE user_id = '${userId}'`),
  ).toEqual([{ count: 1 }]);
});

test("匿名の参加者がログインすると参加者IDを切り替え、匿名のセッションとその接続を閉じる", async ({
  page,
  context,
}) => {
  test.setTimeout(45_000);
  const code = await create(page, "まえの名前");
  const anonymousId = (await snapshot(page)).hostId;
  // 同じブラウザのほかのタブも、同じ匿名のセッションでルームに接続している。
  const otherTab = await context.newPage();
  await loadApi(otherTab);
  await connect(otherTab, code);

  const userId = await signIn(context, {
    provider: "discord",
    email: `${crypto.randomUUID()}@example.test`,
    name: "ぴくせる侍",
  });
  expect(userId).not.toBe(anonymousId);
  expect(await page.evaluate(() => window.animicTest.getCurrentParticipant())).toEqual({
    id: userId,
    isAnonymous: false,
    account: { name: "ぴくせる侍", provider: "discord" },
  });
  // 匿名のユーザーは残し、セッションだけを失効させる。
  expect(
    await executeLocalD1(`SELECT count(*) AS count FROM session WHERE user_id = '${anonymousId}'`),
  ).toEqual([{ count: 0 }]);
  expect(await executeLocalD1(`SELECT id FROM user WHERE id = '${anonymousId}'`)).toHaveLength(1);

  // 匿名で参加したルームの参加記録は引き継がない。
  const entry = await page.evaluate(
    (value) => window.animicTest.getRoomEntry({ data: { code: value } }),
    code,
  );
  expect(entry.room).toBeNull();
  // 参加すると状態を配信する前にセッションを確かめ、失効した匿名のセッションの接続を閉じる。
  await page.evaluate(
    (value) => window.animicTest.joinRoom({ data: { code: value, name: "ぴくせる侍" } }),
    code,
  );
  await expect
    .poll(() => otherTab.evaluate(() => window.animicTest.connection()), { timeout: 35_000 })
    .toContain("セッションが失効しました");
});
