import { createContext, use, useCallback, useEffect, useState } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Dialog } from "@animic/react/dialog";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import type { ScoringMetricsReport } from "../scoring/scoring-metrics";
import { summarizeSubmission } from "./battle-history";
import type { BattleSnapshot } from "./battle-state";
import { getResultScoringMetrics } from "./battle.functions";
import { ScoreBreakdown } from "./score-breakdown";

type Metrics =
  | { status: "loading" | "error" }
  | { status: "loaded"; metrics: ScoringMetricsReport | null };
type Score = NonNullable<BattleSnapshot["scores"]>[number];

/** 参加者の指標ごとの点を読む関数。 */
export type ScoringMetricsLoader = (participantId: string) => Promise<ScoringMetricsReport | null>;

/**
 * 指標の読み方を差し替える口。値が`null`（既定）なら、ルームの対戦について`getResultScoringMetrics`で読む。
 * ルームのない画面（開発用の確認画面など）で、読み方を外から渡すために使う。
 */
export const ScoringMetricsLoaderContext = createContext<ScoringMetricsLoader | null>(null);

function useLoadMetrics(code: string, battleId: string) {
  const loader = use(ScoringMetricsLoaderContext);
  return useCallback(
    (participantId: string) =>
      (
        loader?.(participantId) ??
        getResultScoringMetrics({ data: { code, battleId, participantId } })
      ).then(
        (metrics): Metrics => ({ status: "loaded", metrics }),
        (): Metrics => ({ status: "error" }),
      ),
    [loader, code, battleId],
  );
}

/**
 * 結果画面に出す、参加者ごとの指標の点。最初の描画の後に全員分を読み、読めた人の分だけを返す。
 * 結果発表の採点の様子と、順位の一覧の要点で使う。届く前の人や読めなかった人は点なしで表示する（待たない）。
 */
export function useResultMetrics(
  code: string,
  battleId: string,
  participantIds: readonly string[],
) {
  const load = useLoadMetrics(code, battleId);
  const [metrics, setMetrics] = useState<ReadonlyMap<string, ScoringMetricsReport>>(new Map());
  const key = participantIds.join(",");
  useEffect(() => {
    let active = true;
    const add = (participantId: string, loaded: Metrics) => {
      const report = loaded.status === "loaded" ? loaded.metrics : null;
      if (active && report) setMetrics((current) => new Map(current).set(participantId, report));
    };
    for (const participantId of key ? key.split(",") : [])
      void load(participantId).then((loaded) => add(participantId, loaded));
    return () => {
      active = false;
    };
  }, [load, key]);
  return metrics;
}

/** 参加者のスコアの内訳と指標ごとの点。指標は表示したときに読み出す。 */
function BreakdownContent({
  code,
  battle,
  score,
}: {
  code: string;
  battle: BattleSnapshot;
  score: Score;
}) {
  const { participantId } = score;
  const load = useLoadMetrics(code, battle.id);
  const [metrics, setMetrics] = useState<Metrics>({ status: "loading" });
  useEffect(() => {
    let active = true;
    void load(participantId).then((loaded) => active && setMetrics(loaded));
    return () => {
      active = false;
    };
  }, [load, participantId]);
  return (
    <Stack space="compact">
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
              void load(participantId).then(setMetrics);
            }}
          >
            再試行
          </Button>
        </Cluster>
      )}
    </Stack>
  );
}

const breakdownTitle = (name: string, mine: boolean) =>
  mine ? "あなたのスコアの内訳" : `${name}さんのスコアの内訳`;

/** 順位の一覧の行から、その人のスコアの内訳を開く操作。指標は開いたときに読む。 */
export function ResultBreakdownButton({
  code,
  battle,
  score,
  name,
  mine,
}: {
  code: string;
  battle: BattleSnapshot;
  score: Score;
  name: string;
  mine: boolean;
}) {
  const [open, setOpen] = useState(false);
  const title = breakdownTitle(name, mine);
  return (
    <>
      <Button
        appearance="secondary"
        shape="pill"
        size="xs"
        aria-label={title}
        onClick={() => setOpen(true)}
      >
        内訳
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        size="compact"
        presentation="centered"
        closeButton={false}
      >
        <Stack>
          {open && <BreakdownContent code={code} battle={battle} score={score} />}
          <Button appearance="secondary" shape="pill" onClick={() => setOpen(false)}>
            閉じる
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}
