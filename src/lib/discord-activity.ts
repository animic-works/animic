import * as v from "valibot";

export const discordInstanceIdSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(256));

/** Discordのプロキシ以外のOriginを許可しない。クライアントIDはサーバーの設定を使う。 */
export function discordActivityOrigin(clientId: string) {
  return `https://${clientId}.discordsays.com`;
}

export function isDiscordActivityRequest(headers: Headers, clientId: string) {
  const origin = headers.get("Origin");
  if (origin) return origin === discordActivityOrigin(clientId);
  try {
    return new URL(headers.get("Referer") ?? "").origin === discordActivityOrigin(clientId);
  } catch {
    return false;
  }
}
