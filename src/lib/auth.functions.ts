import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { account } from "./auth-schema";
import { createAuth } from "./auth.server";
import { loginProviderSchema } from "./login-providers";

export const getCurrentParticipant = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "private, no-store");
  const result = await createAuth().api.getSession({ headers: getRequestHeaders() });
  if (!result) return null;
  const { user } = result;
  if (user.isAnonymous) return { id: user.id, isAnonymous: true, account: null };
  // ログインのたびにBetter Authがアカウントのトークンを更新するため、更新日時が最新のものが最後にログインに使ったサービス。
  const [latest] = await drizzle(env.DB)
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, user.id))
    .orderBy(desc(account.updatedAt))
    .limit(1);
  const provider = v.safeParse(loginProviderSchema, latest?.providerId);
  return {
    id: user.id,
    isAnonymous: false,
    // アイコンは保存した文字列のまま返し、選べる値かどうかは画面側（account）で確かめる。
    account: {
      name: user.name,
      provider: provider.success ? provider.output : null,
      icon: user.icon ?? null,
    },
  };
});
