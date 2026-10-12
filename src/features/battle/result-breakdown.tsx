import { useEffect, useState } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Heading } from "@animic/react/heading";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import type { ScoringMetricScores } from "../scoring/scoring-metrics";
import { summarizeSubmission } from "./battle-history";
import type { BattleSnapshot } from "./battle-state";
import { getResultScoringMetrics } from "./battle.functions";
import { ScoreBreakdown } from "./score-breakdown";

type Metrics =
  | { status: "loading" | "error" }
  | { status: "loaded"; metrics: ScoringMetricScores | null };

function loadMetrics(code: string, battleId: string, participantId: string) {
  return getResultScoringMetrics({ data: { code, battleId, participantId } }).then(
    (metrics): Metrics => ({ status: "loaded", metrics }),
    (): Metrics => ({ status: "error" }),
  );
}

/**
 * 結果画面に出す、採点された参加者のスコアの内訳と指標ごとの点。
 * 内訳は結果の確定後に配信される`scores`から出し、指標はルームの状態に含めないため表示したときに読み出す。
 */
export function ResultBreakdown({
  code,
  battle,
  score,
  name,
  mine,
}: {
  code: string;
  battle: BattleSnapshot;
  score: NonNullable<BattleSnapshot["scores"]>[number];
  name: string;
  mine: boolean;
}) {
  const { participantId } = score;
  const [metrics, setMetrics] = useState<Metrics>({ status: "loading" });
  useEffect(() => {
    let active = true;
    void loadMetrics(code, battle.id, participantId).then((loaded) => active && setMetrics(loaded));
    return () => {
      active = false;
    };
  }, [code, battle.id, participantId]);

  return (
    <Surface appearance="card" padding="content">
      <Stack space="compact">
        <Heading level={2} size="sm">
          {mine ? "あなたのスコアの内訳" : `${name}さんのスコアの内訳`}
        </Heading>
        <ScoreBreakdown
          score={score}
          submission={summarizeSubmission(score.submission, battle.startedAt)}
          metrics={metrics.status === "loaded" ? metrics.metrics : null}
        />
        {metrics.status === "loading" && <Spinner label="指標を読み込んでいます" />}
        {metrics.status === "error" && (
          <Cluster justify="between">
            <div role="alert">
              <Text tone="danger">指標を読み込めませんでした。</Text>
            </div>
            <Button
              appearance="secondary"
              shape="pill"
              size="sm"
              onClick={() => {
                setMetrics({ status: "loading" });
                void loadMetrics(code, battle.id, participantId).then(setMetrics);
              }}
            >
              再試行
            </Button>
          </Cluster>
        )}
      </Stack>
    </Surface>
  );
}
