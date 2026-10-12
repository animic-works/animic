import { Cluster } from "@animic/react/cluster";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { Meter } from "@animic/react/meter";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import type { FinalScore } from "../scoring/final-score";
import { scoringMetrics, type ScoringMetricScores } from "../scoring/scoring-metrics";
import type { summarizeSubmission } from "./battle-history";

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

/** ボーナスの点。取れなかった人は0。小数は分け合ったときだけ出る。 */
function formatBonus(points: number) {
  return `ボーナス +${points.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}`;
}

/**
 * 参加者のスコアの内訳（再現度・提出時間・生成回数と、取ったボーナス）と、指標ごとの点。
 * 戦績の詳細と結果画面で使う。見出しは使う側で付ける。`metrics`が`null`なら指標を出さない。
 * その対戦で定義していない（点が0の）ボーナスは出さない。
 */
export function ScoreBreakdown({
  score,
  submission,
  metrics,
}: {
  score: FinalScore | null;
  submission: ReturnType<typeof summarizeSubmission>;
  metrics: ScoringMetricScores | null;
}) {
  const terms = [
    { label: "再現度", value: formatTotal(score?.similarity ?? null), bonus: null },
    {
      label: "提出時間",
      value: submission ? `${submission.seconds}秒` : "—",
      bonus: score?.speedBonus ?? null,
    },
    {
      label: "生成回数",
      value: submission ? `${submission.generationCount}回` : "—",
      bonus: score?.generationBonus ?? null,
    },
    { label: "合計", value: formatTotal(score?.total ?? null), bonus: null, strong: true },
  ];
  return (
    <Stack space="compact">
      <Grid columns={4} space="compact" collapse="none">
        {terms.map((term) => (
          <Surface key={term.label} appearance="subtle" padding="xs">
            <Stack space="tight">
              <Text variant="caption" tone="muted">
                {term.label}
              </Text>
              <Text variant="code" emphasis={term.strong ? "strong" : undefined}>
                {term.value}
              </Text>
              {term.bonus !== null && (
                <Text
                  variant="caption"
                  tone={term.bonus > 0 ? undefined : "muted"}
                  emphasis={term.bonus > 0 ? "strong" : undefined}
                >
                  {formatBonus(term.bonus)}
                </Text>
              )}
            </Stack>
          </Surface>
        ))}
      </Grid>
      {metrics && (
        <Stack space="compact">
          <Heading level={3} size="sm">
            指標
          </Heading>
          {scoringMetrics.map((metric) => {
            const point = metrics[metric.key];
            return point === null ? (
              <Cluster key={metric.key} justify="between">
                <Text variant="label.supporting">
                  {metric.label}（{metric.name}）
                </Text>
                <Text variant="caption" tone="muted">
                  採点の対象外
                </Text>
              </Cluster>
            ) : (
              <Meter
                key={metric.key}
                label={metric.label}
                description={metric.name}
                value={point}
                valueText={point.toFixed(1)}
                presentation="row"
              />
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
