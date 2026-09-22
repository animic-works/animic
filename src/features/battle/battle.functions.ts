import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { roomCodeSchema } from "../room/room-state";
import { battleSettingsSchema, topicSchema } from "./battle-state";
import { topic } from "./battle.schema";

export const startBattle = createServerFn({ method: "POST" })
  .validator(
    v.object({
      code: roomCodeSchema,
      settings: battleSettingsSchema,
      previousBattleId: v.nullable(v.pipe(v.string(), v.uuid())),
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
    if (!current) return { error: "参加するにはセッションの再作成が必要です。" };
    const room = env.ROOMS.getByName(data.code);
    if (!(await room.canStart(current.user.id, data.previousBattleId)))
      return { error: "ホストが2人以上のルームで開始してください。" };
    const [chosen] = await drizzle(env.DB)
      .select()
      .from(topic)
      .where(eq(topic.difficulty, data.settings.difficulty))
      .orderBy(sql`random()`)
      .limit(1);
    if (!chosen) return { error: "この難易度のお題がありません。別の難易度を選んでください。" };
    await room.startBattle(
      current.user.id,
      data.settings,
      v.parse(topicSchema, chosen),
      data.previousBattleId,
    );
    return { error: null };
  });

export const submitBattleImage = createServerFn({ method: "POST" })
  .validator(
    v.object({
      code: roomCodeSchema,
      battleId: v.pipe(v.string(), v.uuid()),
      generationId: v.pipe(v.string(), v.uuid()),
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
    if (!current) throw new Error("参加するにはセッションの再作成が必要です。");
    await env.ROOMS.getByName(data.code).submitImage(
      data.battleId,
      current.user.id,
      data.generationId,
    );
  });
