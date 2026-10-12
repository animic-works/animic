import { Cluster } from "@animic/react/cluster";
import { Grade } from "@animic/react/grade";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { MediaObject } from "@animic/react/media-object";
import { Meter } from "@animic/react/meter";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import type { FinalScore } from "../scoring/final-score";
import { getScoreRank } from "../scoring/score-rank";
import { scoringMetrics, type ScoringMetricsReport } from "../scoring/scoring-metrics";
import type { summarizeSubmission } from "./battle-history";

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

/** ボーナスの点。取れなかった人は0。小数は分け合ったときだけ出る。 */
function formatBonus(points: number) {
  return `ボーナス +${points.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}`;
}

/** 0〜100点の点数のランク（S〜D）の印。 */
function ScoreGrade({ score, size }: { score: number; size?: "sm" | "lg" }) {
  const { rank, tone } = getScoreRank(score);
  return <Grade value={rank} label={`ランク${rank}`} tone={tone} size={size} />;
}

/**
 * 参加者のスコアの内訳（再現度・提出時間・生成回数と、取ったボーナス）と、指標ごとの点。
 * 再現度と指標の点には、ランクの印を添えてランクの色で出す。
 * 戦績の詳細と結果画面で使う。見出しは使う側で付ける。`metrics`が`null`なら指標を出さない。
 * 指標はモデル名ではなく、トップページの採点方法と同じ名前と、その対戦を始めたときの重みで出す。
 * その対戦で定義していない（点が0の）ボーナスは出さない。
 */
export function ScoreBreakdown({
  score,
  submission,
  metrics,
}: {
  score: FinalScore | null;
  submission: ReturnType<typeof summarizeSubmission>;
  metrics: ScoringMetricsReport | null;
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
  const summary = (
    <Grid columns={2} space="compact" collapse="none">
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
  );
  return (
    <Stack space="compact">
      {score ? (
        <MediaObject media={<ScoreGrade score={score.similarity} size="lg" />}>
          {summary}
        </MediaObject>
      ) : (
        summary
      )}
      {metrics && (
        <Stack space="compact">
          <Heading level={3} size="sm">
            指標
          </Heading>
          {scoringMetrics.map((metric) => {
            const point = metrics.scores[metric.key];
            // 重みを記録する前の対戦では、重みを出さない。
            const description = metrics.weights
              ? `${metric.description}・重み ${metrics.weights[metric.key]}%`
              : metric.description;
            return (
              <MediaObject
                key={metric.key}
                media={
                  point === null ? (
                    <Grade value="－" label="ランクなし" />
                  ) : (
                    <ScoreGrade score={point} />
                  )
                }
              >
                {point === null ? (
                  <Cluster justify="between">
                    <Stack space="tight">
                      <Text variant="caption" emphasis="strong">
                        {metric.label}
                      </Text>
                      <Text variant="caption" tone="supporting">
                        {description}
                      </Text>
                    </Stack>
                    <Text variant="caption" tone="muted">
                      採点の対象外
                    </Text>
                  </Cluster>
                ) : (
                  <Meter
                    label={metric.label}
                    description={description}
                    value={point}
                    valueText={point.toFixed(1)}
                    tone={getScoreRank(point).tone}
                    presentation="row"
                  />
                )}
              </MediaObject>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
