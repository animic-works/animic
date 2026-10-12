/**
 * 0〜100点の点数のランク。結果画面と戦績の詳細で、点数をランクの文字と色で見せる。
 * 高い順に並べ、`min`以上で最初に当てはまるランクにする。`tone`は印・Meterの面の色、
 * `text`は白い面の上でも読める（WCAG AAの）点数の文字の色。Sは濃い文字に、大きな数字では
 * 見出しの「1st!」と同じ黄とピンクのずらした影（`emphasis`）を添えて、いちばん上の段階らしく見せる。
 */
const scoreRanks = [
  { min: 85, rank: "S", tone: "highlight", text: "default", emphasis: "offset" },
  { min: 70, rank: "A", tone: "primary", text: "primary", emphasis: undefined },
  { min: 55, rank: "B", tone: "secondary", text: "secondary", emphasis: undefined },
  { min: 40, rank: "C", tone: "success", text: "success", emphasis: undefined },
  { min: -Infinity, rank: "D", tone: "neutral", text: "muted", emphasis: undefined },
] as const;

export type ScoreRank = (typeof scoreRanks)[number];

export function getScoreRank(score: number): ScoreRank {
  return scoreRanks.find((item) => score >= item.min) ?? scoreRanks[4];
}
