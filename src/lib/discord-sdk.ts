import type { DiscordSDK } from "@discord/embedded-app-sdk";
import * as v from "valibot";

let sdk: DiscordSDK | null = null;
let signingIn: Promise<{ instanceId: string; discordUserId: string }> | null = null;
const responseSchema = v.object({ accessToken: v.string(), discordUserId: v.string() });

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/** 再描画・StrictModeで認可コードを二重に交換しない。失敗時には新しいコードで再試行する。 */
export function authenticateActivity(clientId: string) {
  signingIn ??= (async () => {
    const { DiscordSDK } = await import("@discord/embedded-app-sdk");
    sdk ??= new DiscordSDK(clientId, { disableConsoleLogOverride: true });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        sdk.ready(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(new Error("Discordに接続できませんでした。Activityを開き直してください。")),
            15_000,
          );
        }),
      ]);
    } catch (error) {
      sdk.close(1000, "接続できませんでした");
      sdk = null;
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = base64url(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))),
    );
    const { code } = await sdk.commands.authorize({
      client_id: clientId,
      response_type: "code",
      prompt: "none",
      scope: ["identify", "email"],
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    const response = await fetch("/api/auth/sign-in/discord-activity", {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, codeVerifier, instanceId: sdk.instanceId }),
    });
    if (!response.ok)
      throw new Error(
        "Discordでログインできませんでした。許可と接続を確認して、もう一度お試しください。",
      );
    const result = v.parse(responseSchema, await response.json());
    const authenticated = await sdk.commands.authenticate({ access_token: result.accessToken });
    if (authenticated.user.id !== result.discordUserId)
      throw new Error("Discordのアカウントが切り替わりました。Activityを開き直してください。");
    return { instanceId: sdk.instanceId, discordUserId: result.discordUserId };
  })().catch((error: unknown) => {
    signingIn = null;
    throw error;
  });
  return signingIn;
}

export function activitySdk() {
  return sdk;
}

export function closeActivity() {
  sdk?.close(1000, "Animicを終了しました");
  sdk = null;
  signingIn = null;
}

export function resetActivityAuthentication() {
  signingIn = null;
}
