import { desc, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { defaultScoringWeights, scoringWeightsSchema } from "./scoring-metrics";
import type { ScoringWeights } from "./scoring-metrics";
import { scoringWeight } from "./scoring.schema";

/**
 * `at`の時点で使う重みと、その重みを保存した日時。保存した重みがなければ既定値（日時は`null`）。
 * `at`を省くと今の重み。
 */
export async function loadScoringWeights(
  db: D1Database,
  at = new Date(),
): Promise<{ weights: ScoringWeights; savedAt: number | null }> {
  const [row] = await drizzle(db)
    .select()
    .from(scoringWeight)
    .where(lte(scoringWeight.createdAt, at))
    .orderBy(desc(scoringWeight.createdAt))
    .limit(1);
  const weights = row ? v.safeParse(scoringWeightsSchema, JSON.parse(row.weights)) : null;
  return weights?.success && row
    ? { weights: weights.output, savedAt: row.createdAt.getTime() }
    : { weights: defaultScoringWeights, savedAt: null };
}

/** 重みを保存する。前の重みは、保存より前に始まった対戦のために残す。 */
export async function saveScoringWeights(db: D1Database, weights: ScoringWeights) {
  await drizzle(db)
    .insert(scoringWeight)
    .values({ id: crypto.randomUUID(), weights: JSON.stringify(weights), createdAt: new Date() });
}
