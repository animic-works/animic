import { useEffect, useRef, useState } from "react";
import { AppFrame } from "@animic/react/app-frame";
import { Badge } from "@animic/react/badge";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { Page } from "@animic/react/page";
import { Progress } from "@animic/react/progress";
import { Readout } from "@animic/react/readout";
import { AppBrand } from "../shared/app-brand";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import type { AccountIcon } from "../account/account-icon";
import { levels } from "../room/room-presentation";
import { useReducedMotion } from "./battle-preferences";
import type { BattleSnapshot } from "./battle-state";
import { useResultMetrics } from "./result-breakdown";
import { getRevealOrder, getRevealStage } from "./result-presentation";
import { RankingResult } from "./result-ranking";
import { ResultReveal, RevealCounter, RevealSkip } from "./result-reveal";
import { useServerNow } from "./use-remaining-ms";

function RevealProgress({ value }: { value: number }) {
  return <Progress label="発表の進み具合" value={value} presentation="track" tone="gradient" />;
}

/**
 * 結果画面。採点で結果が決まった対戦では、採点された人を提出の早い順に1人ずつ発表してから、最終の結果を出す。
 * 発表の進み具合は、結果が決まった時刻からの経過をサーバーの時刻で数えるため、全員の画面で同じ人を発表する。
 * スキップ・動きを減らす設定・発表が終わった後に開いた場合は、最終の結果だけを出す。
 */
export function ResultPage({
  code,
  battle,
  participantId,
  names,
  icons,
  receivedAt,
  onRematch,
  onTop,
}: {
  code: string;
  battle: BattleSnapshot;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  /** Snapshotを受信した時刻（`performance.now()`）。サーバーの描画では`null`。 */
  receivedAt: number | null;
  onRematch: () => void;
  onTop: () => void;
}) {
  const order = getRevealOrder(battle);
  const reduced = useReducedMotion();
  const [skipped, setSkipped] = useState(false);
  // 一度最終の結果を出したら、後から届いた配信で発表へ戻さない。
  const [ended, setEnded] = useState(false);
  const live = order.length > 0 && !reduced && !skipped && !ended;
  const now = useServerNow(battle.serverTime, receivedAt, live);
  const stage = live
    ? getRevealStage(order.length, now - (battle.result?.decidedAt ?? now))
    : ({ kind: "final" } as const);
  if (live && stage.kind === "final") setEnded(true);
  const metrics = useResultMetrics(
    code,
    battle.id,
    order.map((entry) => entry.participantId),
  );
  // 発表を見終えた・飛ばしたとき、消えたスキップにあったフォーカスを再戦の操作へ移す。
  const [watched, setWatched] = useState(false);
  if (stage.kind === "reveal" && !watched) setWatched(true);
  const final = stage.kind === "final";
  const rematch = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (final && watched && document.activeElement === document.body)
      rematch.current?.focus({ preventScroll: true });
  }, [final, watched]);
  if (!battle.result) return null;

  const context = (
    <Cluster space="compact">
      <Badge>
        ルーム <CodeDisplay value={code} presentation="inline" />
      </Badge>
      <Badge tone="surface">
        {levels[battle.settings.difficulty].label}・{battle.settings.durationSeconds}秒
      </Badge>
    </Cluster>
  );
  return (
    <Page decoration={<GridBackdrop />}>
      {stage.kind === "reveal" ? (
        <AppFrame
          brand={<AppBrand />}
          context={context}
          actions={
            <>
              <RevealCounter stage={stage} count={order.length} />
              <RevealSkip onSkip={() => setSkipped(true)} />
            </>
          }
          compactContext={<RevealCounter stage={stage} count={order.length} />}
          compactActions={<RevealSkip compact onSkip={() => setSkipped(true)} />}
          progress={<RevealProgress value={stage.progress * 100} />}
        >
          <ResultReveal
            battle={battle}
            order={order}
            stage={stage}
            participantId={participantId}
            names={names}
            icons={icons}
            metrics={metrics.get(order[stage.index].participantId)}
          />
        </AppFrame>
      ) : (
        <AppFrame
          brand={<AppBrand />}
          context={context}
          actions={<Readout label="RESULT" value="結果発表" />}
          // 狭い画面では、結果を広く見せるためロゴだけにする。
          compactContext={null}
          progress={order.length > 0 && <RevealProgress value={100} />}
        >
          <RankingResult
            battle={battle}
            participantId={participantId}
            names={names}
            icons={icons}
            metrics={metrics}
            rematchRef={rematch}
            onRematch={onRematch}
            onTop={onTop}
          />
        </AppFrame>
      )}
    </Page>
  );
}
