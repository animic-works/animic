import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import type { BetterAuthPlugin } from "better-auth/types";
import * as v from "valibot";

import { exchangeDiscordCode, verifyDiscordInstance } from "./discord-api.server";

import { discordInstanceIdSchema } from "./discord-activity";

/** SDKの認可コードを通常のDiscordログインと同じaccount・userへ結び付ける。 */
export function discordActivitySignIn() {
  return {
    id: "animic-discord-activity",
    endpoints: {
      signInDiscordActivity: createAuthEndpoint(
        "/sign-in/discord-activity",
        {
          method: "POST",
          body: v.object({
            code: v.pipe(v.string(), v.minLength(1), v.maxLength(2048)),
            codeVerifier: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43,128}$/)),
            instanceId: discordInstanceIdSchema,
          }),
        },
        async (ctx) => {
          let verified;
          try {
            verified = await exchangeDiscordCode(ctx.body.code, ctx.body.codeVerifier);
            await verifyDiscordInstance(ctx.body.instanceId, verified.user.id);
          } catch (error) {
            throw new APIError("UNAUTHORIZED", {
              message: "Discordへの接続を確認して、もう一度お試しください。",
              cause: error,
            });
          }
          const { user, token } = verified;
          if (!user.email)
            throw new APIError("BAD_REQUEST", {
              message: "Discordにメールアドレスを登録してからお試しください。",
            });
          const result = await handleOAuthUserInfo(ctx, {
            userInfo: {
              id: user.id,
              email: user.email,
              emailVerified: user.verified,
              name: user.global_name || user.username,
            },
            account: {
              providerId: "discord",
              accountId: user.id,
              accessToken: token.access_token,
              refreshToken: token.refresh_token,
              accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
              scope: token.scope,
            },
            overrideUserInfo: false,
          });
          if (!result.data)
            throw new APIError("UNAUTHORIZED", {
              message: "アカウントを確認できませんでした。Web版のログイン状態を確認してください。",
            });
          await setSessionCookie(ctx, result.data);
          ctx.setHeader("Cache-Control", "private, no-store");
          // accessTokenはSDK.authenticateに必要。localStorageやURLには保存しない。
          return ctx.json({ accessToken: token.access_token, discordUserId: user.id });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
