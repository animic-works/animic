import { desc, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { defaultScoreBonus, scoreBonusSchema } from "./final-score";
import type { ScoreBonus } from "./final-score";
import { defaultScoringWeights, scoringWeightsSchema } from "./scoring-metrics";
import type { ScoringWeights } from "./scoring-metrics";
import { scoringWeight } from "./scoring.schema";

/**
 * `at`の時点で使う重みとボーナス、それを保存した日時。保存した行がなければ既定値（日時は`null`）。
 * ボーナスの列がない（ボーナスを加える前に保存した）行は、ボーナスに既定値を使う。`at`を省くと今の値。
 */
export async function loadScoringWeights(
  db: D1Database,
  at = new Date(),
): Promise<{ weights: ScoringWeights; bonus: ScoreBonus; savedAt: number | null }> {
  const [row] = await drizzle(db)
    .select()
    .from(scoringWeight)
    .where(lte(scoringWeight.createdAt, at))
    .orderBy(desc(scoringWeight.createdAt))
    .limit(1);
  if (!row) return { weights: defaultScoringWeights, bonus: defaultScoreBonus, savedAt: null };
  const weights = v.safeParse(scoringWeightsSchema, JSON.parse(row.weights));
  const bonus = v.safeParse(scoreBonusSchema, {
    speedPoints: row.speedBonus ?? defaultScoreBonus.speedPoints,
    generationPoints: row.generationBonus ?? defaultScoreBonus.generationPoints,
    minSimilarity: row.bonusMinSimilarity ?? defaultScoreBonus.minSimilarity,
  });
  return weights.success && bonus.success
    ? { weights: weights.output, bonus: bonus.output, savedAt: row.createdAt.getTime() }
    : { weights: defaultScoringWeights, bonus: defaultScoreBonus, savedAt: null };
}

/** 重みとボーナスを保存する。前の値は、保存より前に始まった対戦のために残す。 */
export async function saveScoringWeights(
  db: D1Database,
  { weights, bonus }: { weights: ScoringWeights; bonus: ScoreBonus },
) {
  await drizzle(db)
    .insert(scoringWeight)
    .values({
      id: crypto.randomUUID(),
      weights: JSON.stringify(weights),
      speedBonus: bonus.speedPoints,
      generationBonus: bonus.generationPoints,
      bonusMinSimilarity: bonus.minSimilarity,
      createdAt: new Date(),
    });
}
