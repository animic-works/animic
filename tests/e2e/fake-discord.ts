import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import * as v from "valibot";
import { e2eOAuthClients } from "./oauth-clients";

export const fakeDiscordUrl = "http://127.0.0.1:4175";
export const e2eDiscordBotToken = "e2e-discord-bot";
const grantSchema = v.object({
  id: v.string(),
  email: v.string(),
  instanceId: v.string(),
  challenge: v.string(),
});

/** 認可コードは一度だけ使用でき、PKCEとclient secret、Bot認証を確かめる。 */
export default async function fakeDiscord() {
  const grants = new Map<string, v.InferOutput<typeof grantSchema>>();
  const tokens = new Map<string, v.InferOutput<typeof grantSchema>>();
  const members = new Map<string, Set<string>>();
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const send = (status: number, value: unknown) => {
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(value));
    };
    if (request.url === "/e2e/grant" && request.method === "POST") {
      const grant = v.parse(grantSchema, JSON.parse(body));
      const code = randomUUID();
      grants.set(code, grant);
      const users = members.get(grant.instanceId) ?? new Set<string>();
      users.add(grant.id);
      members.set(grant.instanceId, users);
      send(200, { code });
    } else if (request.url === "/oauth2/token") {
      const form = new URLSearchParams(body);
      const grant = grants.get(form.get("code") ?? "");
      if (
        !grant ||
        form.get("client_id") !== e2eOAuthClients.discord.id ||
        form.get("client_secret") !== e2eOAuthClients.discord.secret ||
        createHash("sha256")
          .update(form.get("code_verifier") ?? "")
          .digest("base64url") !== grant.challenge
      ) {
        send(400, { error: "invalid_grant" });
        return;
      }
      grants.delete(form.get("code") ?? "");
      const token = randomUUID();
      tokens.set(token, grant);
      send(200, {
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "identify email",
      });
    } else if (request.url === "/users/@me") {
      const grant = tokens.get(request.headers.authorization?.replace("Bearer ", "") ?? "");
      if (!grant) {
        send(401, {});
        return;
      }
      send(200, {
        id: grant.id,
        username: "Discord参加者",
        global_name: null,
        email: grant.email,
        verified: true,
      });
    } else if (
      request.url?.startsWith(`/applications/${e2eOAuthClients.discord.id}/activity-instances/`)
    ) {
      if (request.headers.authorization !== `Bot ${e2eDiscordBotToken}`) {
        send(401, {});
        return;
      }
      const instanceId = decodeURIComponent(request.url.split("/").at(-1) ?? "");
      send(200, {
        application_id: e2eOAuthClients.discord.id,
        instance_id: instanceId,
        users: [...(members.get(instanceId) ?? [])],
      });
    } else send(404, {});
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(4175, "127.0.0.1", resolve);
  });
  return () => new Promise<void>((resolve) => server.close(() => resolve()));
}
