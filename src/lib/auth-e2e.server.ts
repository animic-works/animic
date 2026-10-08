import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth/types";
import * as v from "valibot";

import { loginProviderSchema } from "./login-providers";

const bodySchema = v.object({
  provider: loginProviderSchema,
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1)),
});

/**
 * E2E専用のログイン。実際のOAuthを通さずに、GoogleかDiscordでログインした状態を作る。
 *
 * `ANIMIC_E2E=true`のビルドにだけ含め、ローカルのURL以外では拒否する。パスが`/sign-in/`で
 * 始まるため、匿名の参加者がログインしたときのanonymousプラグインの処理も実際のログインと同じく動く。
 */
export function e2eSignIn() {
  return {
    id: "animic-e2e-sign-in",
    endpoints: {
      signInE2e: createAuthEndpoint(
        "/sign-in/e2e",
        { method: "POST", body: bodySchema },
        async (ctx) => {
          if (!["127.0.0.1", "localhost"].includes(new URL(ctx.context.baseURL).hostname))
            throw new APIError("FORBIDDEN");
          const { provider, email, name } = ctx.body;
          const adapter = ctx.context.internalAdapter;
          const found = await adapter.findUserByEmail(email, { includeAccounts: true });
          let user;
          if (found) {
            user = found.user;
            const linked = found.accounts.find((account) => account.providerId === provider);
            // 実際のログインと同じく、使ったサービスのアカウントの更新日時を新しくする。
            if (linked) await adapter.updateAccount(linked.id, { updatedAt: new Date() });
            else
              await adapter.linkAccount({
                providerId: provider,
                accountId: email,
                userId: user.id,
              });
          } else {
            const created = await adapter.createOAuthUser(
              { email, name, emailVerified: true },
              { providerId: provider, accountId: email },
            );
            user = created.user;
          }
          const session = await adapter.createSession(user.id);
          await setSessionCookie(ctx, { session, user });
          return ctx.json({ user: { id: user.id } });
        },
      ),
    },
    // 同じ送信元から何度もログインするため、/sign-in/*の既定の回数制限（10秒に3回）を緩める。
    rateLimit: [{ pathMatcher: (path) => path === "/sign-in/e2e", window: 10, max: 100 }],
  } satisfies BetterAuthPlugin;
}
