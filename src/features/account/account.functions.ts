import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { user } from "../../lib/auth-schema";
import { createAuth } from "../../lib/auth.server";
import { participantNameSchema } from "../room/room-state";
import { accountIconSchema } from "./account-icon";

async function requireAccount() {
  setResponseHeader("Cache-Control", "private, no-store");
  const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
  if (!current || current.user.isAnonymous) throw new Error("ログインしてください。");
  return current.user.id;
}

/** 表示名を変える。作成・参加済みのルームの名前は変えず、次に作成・参加するルームから使う。 */
export const updateDisplayName = createServerFn({ method: "POST" })
  .validator(v.object({ name: participantNameSchema }))
  .handler(async ({ data }) => {
    await drizzle(env.DB)
      .update(user)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(user.id, await requireAccount()));
  });

/** アイコンを変える。表示名と同じく、次に作成・参加するルームから使う。 */
export const updateAccountIcon = createServerFn({ method: "POST" })
  .validator(v.object({ icon: accountIconSchema }))
  .handler(async ({ data }) => {
    await drizzle(env.DB)
      .update(user)
      .set({ icon: data.icon, updatedAt: new Date() })
      .where(eq(user.id, await requireAccount()));
  });
