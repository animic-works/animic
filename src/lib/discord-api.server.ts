import { env } from "cloudflare:workers";
import * as v from "valibot";

const tokenSchema = v.object({
  access_token: v.string(),
  token_type: v.string(),
  expires_in: v.number(),
  refresh_token: v.optional(v.string()),
  scope: v.string(),
});
const userSchema = v.object({
  id: v.string(),
  username: v.string(),
  global_name: v.nullable(v.string()),
  email: v.nullable(v.pipe(v.string(), v.email())),
  verified: v.optional(v.boolean(), false),
});
const instanceSchema = v.object({
  application_id: v.string(),
  instance_id: v.string(),
  users: v.array(v.string()),
});

export function discordBotToken() {
  // Activitiesを使わないWeb環境では設定不要。secretはブラウザーへ返さない。
  return v.parse(v.object({ DISCORD_BOT_TOKEN: v.optional(v.string()) }), env).DISCORD_BOT_TOKEN;
}

async function discordFetch(path: string, init: RequestInit) {
  const response = await fetch(`${env.DISCORD_API_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 429)
    throw new Error("Discordへの接続が混み合っています。少し待ってからお試しください。");
  if (!response.ok) throw new Error("Discordの参加情報を確認できませんでした。");
  return response.json();
}

export async function exchangeDiscordCode(code: string, codeVerifier: string) {
  const token = v.parse(
    tokenSchema,
    await discordFetch("/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
      }),
    }),
  );
  const scopes = new Set(token.scope.split(" "));
  if (
    token.token_type.toLowerCase() !== "bearer" ||
    !scopes.has("identify") ||
    !scopes.has("email")
  )
    throw new Error("Discordのアカウント情報の利用を許可してください。");
  const user = v.parse(
    userSchema,
    await discordFetch("/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }),
  );
  return { token, user };
}

export async function verifyDiscordInstance(instanceId: string, discordUserId: string) {
  const botToken = discordBotToken();
  if (!botToken) throw new Error("Discord Activitiesはまだ利用できません。");
  const instance = v.parse(
    instanceSchema,
    await discordFetch(
      `/applications/${env.DISCORD_CLIENT_ID}/activity-instances/${encodeURIComponent(instanceId)}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    ),
  );
  if (
    instance.application_id !== env.DISCORD_CLIENT_ID ||
    instance.instance_id !== instanceId ||
    !instance.users.includes(discordUserId)
  )
    throw new Error("このDiscord Activityに参加していません。");
}
