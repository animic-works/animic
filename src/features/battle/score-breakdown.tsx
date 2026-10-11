import { Cluster } from "@animic/react/cluster";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { Meter } from "@animic/react/meter";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { scoringMetrics, type ScoringMetricScores } from "../scoring/scoring-metrics";
import type { summarizeSubmission } from "./battle-history";

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

/**
 * 本人のスコアの内訳（再現度・提出時間・生成回数）と、指標ごとの点。
 * 戦績の詳細と結果画面で使う。見出しは使う側で付ける。`metrics`が`null`なら指標を出さない。
 */
export function ScoreBreakdown({
  total,
  submission,
  metrics,
}: {
  total: number | null;
  submission: ReturnType<typeof summarizeSubmission>;
  metrics: ScoringMetricScores | null;
}) {
  const terms = [
    { label: "再現度", value: formatTotal(total) },
    { label: "提出時間", value: submission ? `${submission.seconds}秒` : "—" },
    { label: "生成回数", value: submission ? `${submission.generationCount}回` : "—" },
    { label: "合計", value: formatTotal(total), strong: true },
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
            const score = metrics[metric.key];
            return score === null ? (
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
                value={score}
                valueText={score.toFixed(1)}
                presentation="row"
              />
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
