import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins/anonymous";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { e2eSignIn } from "./auth-e2e.server";
import * as schema from "./auth-schema";

const configSchema = v.object({
  BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(32)),
  BETTER_AUTH_URL: v.pipe(
    v.string(),
    v.url(),
    v.check((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" ||
        (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      );
    }, "HTTPS、またはローカル開発用のURLを指定してください。"),
  ),
});

export function createAuth() {
  const parsed = v.safeParse(configSchema, env);
  if (!parsed.success) {
    throw new Error("BETTER_AUTH_URLと32文字以上のBETTER_AUTH_SECRETを設定してください。");
  }
  const config = parsed.output;
  const secure = new URL(config.BETTER_AUTH_URL).protocol === "https:";
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    appName: "Animic",
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
      // D1はDrizzleの対話的なトランザクションに対応していない。
      transaction: false,
    }),
    session: { cookieCache: { enabled: false } },
    // アイコンはマイページのServer Functionだけで変更し、認証のAPIからは受け付けない。
    user: { additionalFields: { icon: { type: "string", required: false, input: false } } },
    // IDと秘密情報の両方を設定したサービスだけを有効にする。
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        enabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        // Googleにログイン済みのブラウザでも、毎回アカウントを選べるようにする。
        prompt: "select_account",
      },
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        enabled: Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: { "/sign-in/anonymous": { window: 60, max: 20 } },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      // Better Authの自動__Secure-付与を止め、__Host-とSecure属性を一緒に設定する。
      useSecureCookies: false,
      cookiePrefix: secure ? "__Host-animic" : "animic",
      defaultCookieAttributes: { secure, httpOnly: true, sameSite: "lax", path: "/" },
    },
    plugins: [
      anonymous({
        disableDeleteAnonymousUser: true,
        // ログインしたら匿名のセッションを失効させ、同じブラウザのほかのタブのルーム接続も閉じる。
        onLinkAccount: async ({ anonymousUser, newUser, ctx }) => {
          if (anonymousUser.user.id === newUser.user.id) return;
          await ctx.context.internalAdapter.deleteUserSessions(anonymousUser.user.id);
        },
      }),
      ...(ANIMIC_E2E_BUILD ? [e2eSignIn()] : []),
      tanstackStartCookies(),
    ],
  });
}
