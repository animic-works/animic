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

export type ResultMetrics =
  | { status: "loading" | "error" }
  | { status: "loaded"; metrics: ScoringMetricScores | null };

function loadMetrics(code: string, battleId: string, participantId: string) {
  return getResultScoringMetrics({ data: { code, battleId, participantId } }).then(
    (metrics): ResultMetrics => ({ status: "loaded", metrics }),
    (): ResultMetrics => ({ status: "error" }),
  );
}

/**
 * 採点された参加者ごとの指標の点。ルームの状態に含めないため、結果画面を開いたときに全員分を読み出す。
 * 結果発表の採点の様子と、最終の結果のスコアの内訳で同じ値を使う。
 */
export function useResultMetrics(
  code: string,
  battleId: string,
  participantIds: readonly string[],
) {
  const [loaded, setLoaded] = useState<ReadonlyMap<string, ResultMetrics>>(() => new Map());
  const ids = participantIds.join("\n");
  useEffect(() => {
    let active = true;
    for (const id of ids.split("\n").filter(Boolean)) {
      void loadMetrics(code, battleId, id).then(
        (metrics) => active && setLoaded((current) => new Map(current).set(id, metrics)),
      );
    }
    return () => {
      active = false;
    };
  }, [code, battleId, ids]);
  return {
    get: (participantId: string): ResultMetrics =>
      loaded.get(participantId) ?? { status: "loading" },
    retry: (participantId: string) => {
      setLoaded((current) => new Map(current).set(participantId, { status: "loading" }));
      void loadMetrics(code, battleId, participantId).then((metrics) =>
        setLoaded((current) => new Map(current).set(participantId, metrics)),
      );
    },
  };
}

export type ResultMetricsStore = ReturnType<typeof useResultMetrics>;

/** 結果画面に出す、採点された参加者のスコアの内訳と指標ごとの点。内訳は結果の確定後に配信される`scores`から出す。 */
export function ResultBreakdown({
  battle,
  score,
  name,
  mine,
  metrics,
  onRetry,
}: {
  battle: BattleSnapshot;
  score: NonNullable<BattleSnapshot["scores"]>[number];
  name: string;
  mine: boolean;
  metrics: ResultMetrics;
  onRetry: () => void;
}) {
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
            <Button appearance="secondary" shape="pill" size="sm" onClick={onRetry}>
              再試行
            </Button>
          </Cluster>
        )}
      </Stack>
    </Surface>
  );
}
