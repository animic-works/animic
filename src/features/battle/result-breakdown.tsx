import { useEffect, useState } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Heading } from "@animic/react/heading";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import type { ScoringMetricsReport } from "../scoring/scoring-metrics";
import { summarizeSubmission } from "./battle-history";
import type { BattleSnapshot } from "./battle-state";
import { getResultScoringMetrics } from "./battle.functions";
import { ScoreBreakdown } from "./score-breakdown";

type Metrics =
  | { status: "loading" | "error" }
  | { status: "loaded"; metrics: ScoringMetricsReport | null };

function loadMetrics(code: string, battleId: string, participantId: string) {
  return getResultScoringMetrics({ data: { code, battleId, participantId } }).then(
    (metrics): Metrics => ({ status: "loaded", metrics }),
    (): Metrics => ({ status: "error" }),
  );
}

/**
 * 結果発表の採点の様子に出す、発表する人ごとの指標の点。発表の始めに全員分を読み、読めた人の分だけを返す。
 * 届く前の人や読めなかった人は、点なしで発表を進める（待たない）。
 */
export function useRevealMetrics(
  code: string,
  battleId: string,
  participantIds: readonly string[],
) {
  const [metrics, setMetrics] = useState<ReadonlyMap<string, ScoringMetricsReport>>(new Map());
  const key = participantIds.join(",");
  useEffect(() => {
    let active = true;
    const add = (participantId: string, loaded: Metrics) => {
      const report = loaded.status === "loaded" ? loaded.metrics : null;
      if (active && report) setMetrics((current) => new Map(current).set(participantId, report));
    };
    for (const participantId of key ? key.split(",") : [])
      void loadMetrics(code, battleId, participantId).then((loaded) => add(participantId, loaded));
    return () => {
      active = false;
    };
  }, [code, battleId, key]);
  return metrics;
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
