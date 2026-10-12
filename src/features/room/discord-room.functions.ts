import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { account } from "../../lib/auth-schema";
import { discordInstanceIdSchema } from "../../lib/discord-activity";
import { discordBotToken, verifyDiscordInstance } from "../../lib/discord-api.server";
import { parseAccountIcon } from "../account/account-icon";

export const getDiscordActivityConfig = createServerFn({ method: "GET" }).handler(() => {
  setResponseHeader("Cache-Control", "private, no-store");
  return env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && discordBotToken()
    ? { clientId: env.DISCORD_CLIENT_ID }
    : null;
});

async function currentMember() {
  setResponseHeader("Cache-Control", "private, no-store");
  const current = await createAuth(getRequestHeaders()).api.getSession({
    headers: getRequestHeaders(),
  });
  if (!current || current.user.isAnonymous) throw new Error("ログインし直してください。");
  return {
    id: current.user.id,
    name: current.user.name.trim().slice(0, 20) || "プレイヤー",
    icon: parseAccountIcon(current.user.icon),
  };
}

export const enterDiscordRoom = createServerFn({ method: "POST" })
  .validator(
    v.object({
      instanceId: discordInstanceIdSchema,
      discordUserId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
    }),
  )
  .handler(async ({ data }) => {
    const member = await currentMember();
    const [linked] = await drizzle(env.DB)
      .select({ discordId: account.accountId })
      .from(account)
      .where(
        and(
          eq(account.userId, member.id),
          eq(account.providerId, "discord"),
          eq(account.accountId, data.discordUserId),
        ),
      )
      .limit(1);
    if (!linked) throw new Error("Discordでログインしてください。");
    await verifyDiscordInstance(data.instanceId, linked.discordId);
    return env.DISCORD_ROOMS.getByName(`${env.DISCORD_CLIENT_ID}:${data.instanceId}`).enter(
      data.instanceId,
      member,
    );
  });
