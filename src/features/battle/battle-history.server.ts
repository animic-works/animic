import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { getScoringMetrics } from "../scoring/scoring-jobs.server";
import { getBattleDetail, getBattleHistoryStats, savedBattleResultSchema } from "./battle-history";
import { battleRecord, battleResult } from "./battle.schema";
import { toImageSrc } from "./image-src";

/** マイページの一覧に出す戦績の数。成績はすべての戦績から求める。 */
const listedRecordCount = 100;

/** 参加者の成績と、新しい順の戦績。 */
export async function getBattleHistory(db: D1Database, participantId: string) {
  const records = await drizzle(db)
    .select({
      battleId: battleRecord.battleId,
      startedAt: battleRecord.startedAt,
      difficulty: battleRecord.difficulty,
      participantCount: battleRecord.participantCount,
      rank: battleRecord.rank,
      total: battleRecord.total,
      imageUrl: battleRecord.imageUrl,
    })
    .from(battleRecord)
    .where(eq(battleRecord.participantId, participantId))
    .orderBy(desc(battleRecord.startedAt));
  return {
    stats: getBattleHistoryStats(records),
    // 保存したURLは保存した時点の`BETTER_AUTH_URL`を基にしているため、同じオリジンのパスにする。
    records: records.slice(0, listedRecordCount).map((record) => ({
      ...record,
      imageUrl: record.imageUrl === null ? null : toImageSrc(record.imageUrl),
    })),
  };
}

/** 参加者が参加した対戦の詳細。参加していない対戦は`null`。 */
export async function getBattleHistoryDetail(
  db: D1Database,
  participantId: string,
  battleId: string,
) {
  const [row] = await drizzle(db)
    .select({ data: battleResult.data })
    .from(battleRecord)
    .innerJoin(battleResult, eq(battleResult.battleId, battleRecord.battleId))
    .where(and(eq(battleRecord.battleId, battleId), eq(battleRecord.participantId, participantId)));
  if (!row) return null;
  const saved = v.parse(savedBattleResultSchema, JSON.parse(row.data));
  return {
    ...getBattleDetail(saved, participantId),
    metrics: await getScoringMetrics(db, battleId, participantId),
  };
}
