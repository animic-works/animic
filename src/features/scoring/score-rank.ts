/**
 * 0〜100点の点数のランク。結果画面と戦績の詳細で、再現度と指標の点をランクの文字と色で見せる。
 * 高い順に並べ、`min`以上で最初に当てはまるランクにする。
 */
const scoreRanks = [
  { min: 85, rank: "S", tone: "highlight" },
  { min: 70, rank: "A", tone: "primary" },
  { min: 55, rank: "B", tone: "secondary" },
  { min: 40, rank: "C", tone: "success" },
  { min: -Infinity, rank: "D", tone: "neutral" },
] as const;

export type ScoreRank = (typeof scoreRanks)[number];

export function getScoreRank(score: number): ScoreRank {
  return scoreRanks.find((item) => score >= item.min) ?? scoreRanks[4];
}
