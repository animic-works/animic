import { createHash, randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import * as v from "valibot";
import { fakeDiscordUrl } from "./fake-discord";
import { connect, join, loadApi, signIn, snapshot } from "./api";
import { e2eOAuthClients } from "./oauth-clients";
import { executeLocalD1 } from "./d1";

const origin = "http://127.0.0.1:4173";
const proxyOrigin = `https://${e2eOAuthClients.discord.id}.discordsays.com`;

declare global {
  interface Window {
    animicDiscordCommand: (command: unknown) => Promise<unknown>;
  }
}

async function grant(request: APIRequestContext, id: string, email: string, instanceId: string) {
  const codeVerifier = randomBytes(32).toString("base64url");
  const response = await request.post(`${fakeDiscordUrl}/e2e/grant`, {
    data: {
      id,
      email,
      instanceId,
      challenge: createHash("sha256").update(codeVerifier).digest("base64url"),
    },
  });
  return {
    code: v.parse(v.object({ code: v.string() }), await response.json()).code,
    codeVerifier,
    instanceId,
  };
}

test("Activity認証はWebのDiscordユーザーを再利用し、PKCE・参加先・Originを検証する", async ({
  context,
}) => {
  const id = randomUUID();
  const email = `${id}@example.test`;
  const instanceId = randomUUID();
  const userId = await signIn(context, {
    provider: "discord",
    accountId: id,
    email,
    name: "Webの名前",
  });
  const data = await grant(context.request, id, email, instanceId);
  const wrongVerifier = await context.request.post("/api/auth/sign-in/discord-activity", {
    headers: { Origin: proxyOrigin },
    data: { ...data, codeVerifier: randomBytes(32).toString("base64url") },
  });
  expect(wrongVerifier.status()).toBe(401);
  const response = await context.request.post("/api/auth/sign-in/discord-activity", {
    headers: { Origin: proxyOrigin },
    data,
  });
  expect(response.status()).toBe(200);
  const cookies = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value)
    .join(";");
  expect(cookies).toContain("SameSite=None");
  expect(cookies).toContain("Secure");
  expect(cookies).toContain("Partitioned");
  expect(cookies).not.toContain("Domain=");
  // HTTPテスト環境にはSecure cookieを戻せないため、署名済みcookieを同一API requestへ直接渡す。
  const sessionCookie = cookies.match(/animic\.session_token=([^;]+)/)?.[1];
  expect(sessionCookie).toBeTruthy();
  const session = await context.request.get("/api/auth/get-session", {
    headers: { Cookie: `animic.session_token=${sessionCookie}` },
  });
  expect(
    v.parse(
      v.object({ user: v.object({ id: v.string(), name: v.string() }) }),
      await session.json(),
    ).user,
  ).toEqual({ id: userId, name: "Webの名前" });
  const replay = await context.request.post("/api/auth/sign-in/discord-activity", {
    headers: { Origin: origin },
    data,
  });
  expect(replay.status()).toBe(401);
  const other = await grant(context.request, id, email, instanceId);
  const wrong = await context.request.post("/api/auth/sign-in/discord-activity", {
    headers: { Origin: origin },
    data: { ...other, instanceId: randomUUID() },
  });
  expect(wrong.status()).toBe(401);
  const foreign = await context.request.post("/api/auth/sign-in/discord-activity", {
    headers: { Origin: "https://evil.example" },
    data: await grant(context.request, id, email, instanceId),
  });
  expect(foreign.status()).toBe(403);
});

test("同じActivityへの並行入室は同じルームになり、Webからも参加できる", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(90_000);
  const instanceId = randomUUID();
  const id = randomUUID();
  const email = `${id}@example.test`;
  const response = await context.request.post("/api/auth/sign-in/discord-activity", {
    headers: { Origin: origin },
    data: await grant(context.request, id, email, instanceId),
  });
  expect(response.status()).toBe(200);
  await loadApi(page);
  const codes = await page.evaluate(
    async (value) =>
      Promise.all([
        window.animicTest.enterDiscordRoom({ data: value }),
        window.animicTest.enterDiscordRoom({ data: value }),
      ]),
    { instanceId, discordUserId: id },
  );
  expect(codes[0]).toBe(codes[1]);
  await connect(page, codes[0]);
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await join(guest, codes[0], "Web参加者");
  await expect.poll(async () => (await snapshot(page)).members.length).toBe(2);
  expect((await snapshot(page)).discordInstanceId).toBe(instanceId);
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('discord-topic', 'easy', 'https://example.invalid/topic.svg')",
  );
  let previousBattleId: string | null = null;
  for (let index = 0; index < 3; index++) {
    const result = await page.evaluate(
      async (data) => {
        await window.animicTest.setRoomSettings({ data });
        return window.animicTest.startBattle({ data });
      },
      {
        code: codes[0],
        previousBattleId,
        settings: { difficulty: "easy" as const, durationSeconds: 2, selectionSeconds: 5 },
      },
    );
    expect(result.error).toBeNull();
    await expect
      .poll(async () => (await snapshot(page)).battle?.result?.kind, { timeout: 12_000 })
      .toBe("no-contest");
    previousBattleId = (await snapshot(page)).battle?.id ?? null;
  }
  expect(
    await page.evaluate((value) => window.animicTest.enterDiscordRoom({ data: value }), {
      instanceId,
      discordUserId: id,
    }),
  ).toBe(codes[0]);
  await guest.goto(`/rooms/${codes[0]}`);
  await guest.getByRole("button", { name: "同じメンバーで再戦", exact: true }).click();
  await expect(guest.getByRole("heading", { name: "ロビー", exact: true })).toBeVisible();
  await expect(guest).toHaveURL(`/rooms/${codes[0]}`);
  await expect
    .poll(async () => {
      const history = await page.evaluate(() => window.animicTest.getMyBattleHistory());
      return history?.records.length;
    })
    .toBe(3);
  const activityHistory = await page.evaluate(() => window.animicTest.getMyBattleHistory());
  const webContext = await browser.newContext();
  await signIn(webContext, { provider: "discord", accountId: id, email, name: "Web" });
  const web = await webContext.newPage();
  await loadApi(web);
  expect(await web.evaluate(() => window.animicTest.getMyBattleHistory())).toEqual(activityHistory);
  await webContext.close();
  await guestContext.close();
});

test("WebからActivityページを開いた場合は起動方法を案内する", async ({ page }) => {
  await page.goto("/activity");
  await expect(page.getByRole("alert")).toContainText(
    "DiscordのアクティビティからAnimicを起動してください",
  );
});

test("実際のEmbedded SDKで準備・認可・認証を経てロビーを開く", async ({ page, context }) => {
  test.setTimeout(45_000);
  const id = randomUUID();
  const instanceId = randomUUID();
  const commands: string[] = [];
  await page.exposeFunction("animicDiscordCommand", async (input: unknown) => {
    const command = v.parse(
      v.object({ cmd: v.string(), nonce: v.string(), args: v.unknown() }),
      input,
    );
    commands.push(command.cmd);
    let data: unknown = {};
    if (command.cmd === "AUTHORIZE") {
      const args = v.parse(
        v.object({
          code_challenge: v.string(),
          code_challenge_method: v.literal("S256"),
          scope: v.array(v.string()),
        }),
        command.args,
      );
      expect(args.scope).toEqual(["identify", "email"]);
      const response = await context.request.post(`${fakeDiscordUrl}/e2e/grant`, {
        data: {
          id,
          instanceId,
          email: `${id}@example.test`,
          challenge: args.code_challenge,
        },
      });
      data = await response.json();
    } else if (command.cmd === "AUTHENTICATE") {
      const args = v.parse(v.object({ access_token: v.string() }), command.args);
      data = {
        access_token: args.access_token,
        user: { id, username: "Discord参加者", discriminator: "0", public_flags: 0 },
        scopes: ["identify", "email"],
        expires: new Date(Date.now() + 3600_000).toISOString(),
        application: { id: e2eOAuthClients.discord.id, name: "Animic", description: "E2E" },
      };
    }
    return { cmd: command.cmd, nonce: command.nonce, evt: null, data };
  });
  await page.addInitScript(() => {
    const messageOrigin = window.location.origin;
    const dispatch = (payload: unknown) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: messageOrigin,
          data: [1, payload],
        }),
      );
    // DiscordクライアントのpostMessage応答だけを模擬し、SDKとAPIは本物を使う。
    Object.defineProperty(window, "postMessage", {
      value: (message: unknown) => {
        if (!Array.isArray(message)) return;
        if (message[0] === 0) {
          window.setTimeout(
            () =>
              dispatch({
                cmd: "DISPATCH",
                evt: "READY",
                nonce: null,
                data: {
                  v: 1,
                  config: { api_endpoint: "//discord.com/api", environment: "production" },
                },
              }),
            0,
          );
        } else if (message[0] === 1) {
          void window.animicDiscordCommand(message[1]).then(dispatch);
        }
      },
    });
  });
  await page.goto(`/activity?frame_id=test&instance_id=${instanceId}&platform=desktop`);
  await expect(page.getByRole("heading", { name: "ロビー", exact: true })).toBeVisible({
    timeout: 20_000,
  });
  expect(commands.slice(0, 2)).toEqual(["AUTHORIZE", "AUTHENTICATE"]);
  await expect(page.getByRole("link", { name: "Animic トップ" })).toHaveCount(0);
  await page.getByRole("button", { name: "招待する", exact: true }).first().click();
  await page.getByRole("button", { name: "Discordで招待", exact: true }).click();
  await expect.poll(() => commands).toContain("OPEN_INVITE_DIALOG");
});
