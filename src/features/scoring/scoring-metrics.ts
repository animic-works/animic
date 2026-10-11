/**
 * 再現度の指標。採点ノードが出力するJSONのキーと、画面に出す名前・重み（%）。
 * 重みは採点ワーカーが再現度を計算するときの値で、トップページの説明に使う。
 */
export const scoringMetrics = [
  { key: "ccip", name: "CCIP", label: "キャラクター", weight: 35 },
  { key: "pixai", name: "PixAI Tagger", label: "タグ", weight: 25 },
  { key: "siglip2", name: "SigLIP 2", label: "内容", weight: 20 },
  { key: "dinov2", name: "DINOv2", label: "画像の特徴", weight: 10 },
  { key: "depth", name: "Depth Anything V2", label: "構図", weight: 10 },
] as const;

/** 指標ごとの0〜100点。除外された指標や失敗した指標は`null`。 */
export type ScoringMetricScores = Record<(typeof scoringMetrics)[number]["key"], number | null>;
