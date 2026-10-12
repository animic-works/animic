import * as v from "valibot";

/**
 * 再現度の指標。採点ノードが出力するJSONのキー、モデル名（`name`）と、参加者に見せる名前と説明。
 * モデル名は運営者向けの画面だけに出す。
 */
export const scoringMetrics = [
  { key: "ccip", name: "CCIP", label: "キャラ", description: "同じキャラに見えるか" },
  {
    key: "pixai",
    name: "PixAI Tagger",
    label: "髪・服・小物",
    description: "見た目の特徴が合っているか",
  },
  {
    key: "siglip2",
    name: "SigLIP 2",
    label: "雰囲気",
    description: "描いている内容やシーンが近いか",
  },
  { key: "dinov2", name: "DINOv2", label: "絵の印象", description: "パッと見たときの近さ" },
  {
    key: "depth",
    name: "Depth Anything V2",
    label: "構図",
    description: "ポーズや配置、奥行き",
  },
] as const;

/** 指標ごとの0〜100点。除外された指標や失敗した指標は`null`。 */
export type ScoringMetricScores = Record<(typeof scoringMetrics)[number]["key"], number | null>;

const weightSchema = v.pipe(
  v.number(),
  v.integer("重みは整数で入力してください。"),
  v.minValue(0, "重みは0以上にしてください。"),
  v.maxValue(100, "重みは100以下にしてください。"),
);

/** 指標ごとの重み（合計100）。人物のいない画像はCCIPを除いて割り直すため、CCIP以外にも重みが要る。 */
export const scoringWeightsSchema = v.pipe(
  v.object({
    ccip: weightSchema,
    pixai: weightSchema,
    siglip2: weightSchema,
    dinov2: weightSchema,
    depth: weightSchema,
  }),
  v.check(
    (weights) => Object.values(weights).reduce((sum, weight) => sum + weight, 0) === 100,
    "重みの合計を100にしてください。",
  ),
  v.check(
    (weights) => weights.pixai + weights.siglip2 + weights.dinov2 + weights.depth > 0,
    "CCIP以外の指標にも重みを付けてください。人物のいない画像はCCIPを除いて採点します。",
  ),
);
export type ScoringWeights = v.InferOutput<typeof scoringWeightsSchema>;

/** 管理画面で変えるまで使う重み。採点ノードの既定値と同じ。 */
export const defaultScoringWeights: ScoringWeights = {
  ccip: 35,
  pixai: 25,
  siglip2: 20,
  dinov2: 10,
  depth: 10,
};

/**
 * 点のある指標だけで重みを割り直した加重平均（小数3桁）。採点ノードの`total`と同じ式。
 * 点のある指標の重みの合計が0なら`null`。
 */
export function weightedTotal(scores: ScoringMetricScores, weights: ScoringWeights) {
  let numerator = 0;
  let denominator = 0;
  for (const { key } of scoringMetrics) {
    const score = scores[key];
    if (score === null) continue;
    numerator += score * weights[key];
    denominator += weights[key];
  }
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 1000 : null;
}
