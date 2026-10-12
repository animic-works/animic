import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { roomCodeSchema } from "../room/room-state";
import { getScoringMetrics } from "../scoring/scoring-jobs.server";
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
    const current = await createAuth(getRequestHeaders()).api.getSession({
      headers: getRequestHeaders(),
    });
    if (!current) return { error: "参加するにはセッションの再作成が必要です。" };
    const room = env.ROOMS.getByName(data.code);
    const error = await room.getStartError(current.user.id, data.previousBattleId);
    if (error) return { error };
    const [chosen] = await drizzle(env.DB)
      .select()
      .from(topic)
      .where(and(eq(topic.status, "published"), eq(topic.difficulty, data.settings.difficulty)))
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
    const current = await createAuth(getRequestHeaders()).api.getSession({
      headers: getRequestHeaders(),
    });
    if (!current) throw new Error("参加するにはセッションの再作成が必要です。");
    await env.ROOMS.getByName(data.code).submitImage(
      data.battleId,
      current.user.id,
      data.generationId,
    );
  });

/**
 * 結果画面に出す、参加者の指標ごとの点。戦績の詳細と同じく採点ジョブの出力から読む。
 * 最終スコアと同じく、採点で結果が決まった後にルームの参加者にだけ返す（`canViewScore`）。
 * ログインしていない参加者も使えるよう、セッションの参加者IDで確かめる。見せられない・採点されていなければ`null`。
 */
export const getResultScoringMetrics = createServerFn({ method: "GET" })
  .validator(
    v.object({
      code: roomCodeSchema,
      battleId: v.pipe(v.string(), v.uuid()),
      participantId: v.pipe(v.string(), v.nonEmpty()),
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const current = await createAuth(getRequestHeaders()).api.getSession({
      headers: getRequestHeaders(),
    });
    if (!current) return null;
    const visible = await env.ROOMS.getByName(data.code).canViewScore(
      data.battleId,
      current.user.id,
      data.participantId,
    );
    return visible ? getScoringMetrics(env.DB, data.battleId, data.participantId) : null;
  });
