import { useId } from "react";
import type { ScoringMetricKey } from "../scoring-metrics";

/**
 * 指標ごとの色。トップページの採点方法のグラフと凡例で同じ色を使う（隣り合う色の色覚差を検証済み）。
 * 対応するPrimitive Token: ccip=pink.2、pixai=cyan.0、siglip2=orange.0、dinov2=violet.0、depth=teal.0。
 */
const metricFills = {
  ccip: "#ff2d87",
  pixai: "#00b4fc",
  siglip2: "#ff7a45",
  dinov2: "#7959fc",
  depth: "#16b37e",
} as const satisfies Record<ScoringMetricKey, string>;

/** 再現度に占める指標ごとの重み（%）を、1本の帯の割合で描く。 */
export function ScoreWeightsBar({
  weights,
}: {
  weights: readonly { key: ScoringMetricKey; weight: number }[];
}) {
  const clip = useId();
  const starts = weights.map((_, index) =>
    weights.slice(0, index).reduce((sum, item) => sum + item.weight, 0),
  );
  return (
    <svg width="100%" height="16" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect width="100%" height="16" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {weights.map(({ key, weight }, index) => (
          <rect
            key={key}
            x={`${starts[index]}%`}
            width={`${weight}%`}
            height="16"
            fill={metricFills[key]}
          />
        ))}
        {starts.slice(1).map((start) => (
          <rect
            key={start}
            x={`${start}%`}
            width="2"
            height="16"
            fill="#fff"
            transform="translate(-1 0)"
          />
        ))}
      </g>
    </svg>
  );
}

/** グラフの色と凡例を結び付ける色見本。 */
export function ScoreWeightSwatch({ metric }: { metric: ScoringMetricKey }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect width="10" height="10" rx="2.5" fill={metricFills[metric]} />
    </svg>
  );
}
