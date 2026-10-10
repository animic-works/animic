import { useState } from "react";
import { Button } from "@animic/react/button";
import { Dialog } from "@animic/react/dialog";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import type { ScoringMetricScores } from "../scoring/scoring-metrics";
import { summarizeSubmission } from "./battle-history";
import type { BattleSnapshot } from "./battle-state";
import { getMyScoringMetrics } from "./battle.functions";
import { ScoreBreakdown } from "./score-breakdown";

type Metrics =
  | { status: "idle" | "loading" | "error" }
  | { status: "loaded"; metrics: ScoringMetricScores | null };

/**
 * 結果画面で、自分のスコアの内訳を開いて見る操作。採点された人にだけ出す。
 * 指標ごとの点は配信しないため、初めて開いたときに読み出す。ほかの参加者の内訳は出さない。
 */
export function ResultBreakdown({
  battle,
  participantId,
}: {
  battle: BattleSnapshot;
  participantId: string;
}) {
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ status: "idle" });
  const total = battle.scores?.find((score) => score.participantId === participantId)?.total;
  if (total === undefined) return null;

  async function load() {
    setMetrics({ status: "loading" });
    try {
      setMetrics({
        status: "loaded",
        metrics: await getMyScoringMetrics({ data: { battleId: battle.id } }),
      });
    } catch {
      setMetrics({ status: "error" });
    }
  }

  return (
    <>
      <Button
        appearance="secondary"
        shape="pill"
        size="sm"
        compactLabel="内訳を見る"
        onClick={() => {
          setOpen(true);
          if (metrics.status === "idle" || metrics.status === "error") void load();
        }}
      >
        スコアの内訳を見る
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="あなたのスコアの内訳"
        size="compact"
        presentation="centered"
        closeButton={false}
      >
        <Stack>
          <ScoreBreakdown
            total={total}
            submission={summarizeSubmission(battle.mySubmission ?? undefined, battle.startedAt)}
            metrics={metrics.status === "loaded" ? metrics.metrics : null}
          />
          {metrics.status === "loading" && <Spinner label="指標を読み込んでいます" />}
          {metrics.status === "error" && (
            <div role="alert">
              <Text tone="danger">指標を読み込めませんでした。開き直すと再試行します。</Text>
            </div>
          )}
          <Button appearance="secondary" shape="pill" onClick={() => setOpen(false)}>
            閉じる
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}
