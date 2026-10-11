import * as v from "valibot";

const bonusPointsSchema = (label: string) =>
  v.pipe(
    v.number(`${label}を数字で入力してください。`),
    v.integer(`${label}は整数で入力してください。`),
    v.minValue(0, `${label}は0〜20点にしてください。`),
    v.maxValue(20, `${label}は0〜20点にしてください。`),
  );

/**
 * 最速提出ボーナス・最少生成ボーナスの点と、ボーナスの対象になる再現度の下限。
 * 点が0のボーナスはないものとして扱い、計算にも画面にも出さない。
 */
export const scoreBonusSchema = v.object({
  speedPoints: bonusPointsSchema("最速提出ボーナス"),
  generationPoints: bonusPointsSchema("最少生成ボーナス"),
  minSimilarity: v.pipe(
    v.number("対象になる再現度の下限を数字で入力してください。"),
    v.integer("対象になる再現度の下限は整数で入力してください。"),
    v.minValue(0, "対象になる再現度の下限は0〜100点にしてください。"),
    v.maxValue(100, "対象になる再現度の下限は0〜100点にしてください。"),
  ),
});
export type ScoreBonus = v.InferOutput<typeof scoreBonusSchema>;

/** 管理画面で保存するまで使うボーナス。 */
export const defaultScoreBonus: ScoreBonus = {
  speedPoints: 3,
  generationPoints: 3,
  minSimilarity: 0,
};

/** ボーナスのない設定。ボーナスを記録する前に始まった対戦に使う。 */
export const noScoreBonus: ScoreBonus = { speedPoints: 0, generationPoints: 0, minSimilarity: 0 };

/**
 * 最終スコアと内訳。`total`は再現度とボーナスの合計。
 * ボーナスは、その対戦で定義していなければ（点が0なら）`null`、定義していて取れなかった人は0。
 */
export const finalScoreSchema = v.object({
  similarity: v.number(),
  speedBonus: v.nullable(v.number()),
  generationBonus: v.nullable(v.number()),
  total: v.number(),
});
export type FinalScore = v.InferOutput<typeof finalScoreSchema>;

/** 採点できた提出。`withinTimeLimit`は制限時間内の提出か（時間切れの後・自動の提出は`false`）。 */
export type ScoredSubmission = {
  participantId: string;
  similarity: number;
  submittedAt: number;
  withinTimeLimit: boolean;
  generationCount: number;
};

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/**
 * `key`がいちばん小さい人に`points`を等分して渡す。同じ値の人が複数いれば人数で割る。
 * 対象がいなければ誰にも渡さない。
 */
function shareBonus(
  candidates: readonly ScoredSubmission[],
  points: number,
  key: (item: ScoredSubmission) => number,
) {
  const shares = new Map<string, number>();
  if (!candidates.length) return shares;
  const best = Math.min(...candidates.map(key));
  const leaders = candidates.filter((item) => key(item) === best);
  for (const item of leaders) shares.set(item.participantId, round3(points / leaders.length));
  return shares;
}

/**
 * 採点できた人の最終スコア。再現度に、最速提出ボーナスと最少生成ボーナス（取った人だけ）を加える。
 * ボーナスの対象は再現度が`minSimilarity`以上の人で、最速提出ボーナスは制限時間内に提出した人に限る。
 * 小数3桁に丸める。
 */
export function computeFinalScores(
  scored: readonly ScoredSubmission[],
  bonus: ScoreBonus,
): (FinalScore & { participantId: string })[] {
  const eligible = scored.filter((item) => item.similarity >= bonus.minSimilarity);
  const speed =
    bonus.speedPoints > 0
      ? shareBonus(
          eligible.filter((item) => item.withinTimeLimit),
          bonus.speedPoints,
          (item) => item.submittedAt,
        )
      : null;
  const generation =
    bonus.generationPoints > 0
      ? shareBonus(eligible, bonus.generationPoints, (item) => item.generationCount)
      : null;
  return scored.map((item) => {
    const speedBonus = speed ? (speed.get(item.participantId) ?? 0) : null;
    const generationBonus = generation ? (generation.get(item.participantId) ?? 0) : null;
    return {
      participantId: item.participantId,
      similarity: item.similarity,
      speedBonus,
      generationBonus,
      total: round3(item.similarity + (speedBonus ?? 0) + (generationBonus ?? 0)),
    };
  });
}
