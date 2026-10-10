/** 再現度の指標。採点ノードが出力するJSONのキーと、画面に出す名前。 */
export const scoringMetrics = [
  { key: "ccip", name: "CCIP", label: "キャラクター" },
  { key: "pixai", name: "PixAI Tagger", label: "タグ" },
  { key: "siglip2", name: "SigLIP 2", label: "内容" },
  { key: "dinov2", name: "DINOv2", label: "画像の特徴" },
  { key: "depth", name: "Depth Anything V2", label: "構図" },
] as const;

/** 指標ごとの0〜100点。除外された指標や失敗した指標は`null`。 */
export type ScoringMetricScores = Record<(typeof scoringMetrics)[number]["key"], number | null>;
