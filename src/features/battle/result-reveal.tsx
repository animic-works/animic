import { useEffect, useState } from "react";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { ComparisonStage } from "@animic/react/comparison-stage";
import { Heading } from "@animic/react/heading";
import { Media } from "@animic/react/media";
import { Progress } from "@animic/react/progress";
import { ProgressList } from "@animic/react/progress-list";
import { Readout } from "@animic/react/readout";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { accountIconAvatar, type AccountIcon } from "../account/account-icon";
import { playerPalettes } from "../room/room-presentation";
import { scoringMetrics } from "../scoring/scoring-metrics";
import { SkipIcon } from "../shared/icons";
import type { BattleSnapshot } from "./battle-state";
import type { ResultMetrics } from "./result-breakdown";
import { getInterimRanks, type RevealEntry, type RevealStage } from "./result-presentation";
import { JudgingScan, RevealCall, StampIn } from "./visuals/result-reveal";

type Revealing = Extract<RevealStage, { kind: "reveal" }>;
type People = {
  participantId: string;
  participantIds: readonly string[];
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
};

const countUpMs = 1_200;

const nameOf = (people: People, id: string) =>
  people.names.get(id) ?? (id === people.participantId ? "あなた" : "参加者");

function PersonAvatar({ people, id }: { people: People; id: string }) {
  const name = nameOf(people, id);
  const seat = people.participantIds.indexOf(id);
  return (
    <Avatar
      size="small"
      name={name}
      fallback={Array.from(name)[0]}
      {...accountIconAvatar(
        people.icons.get(id) ?? null,
        playerPalettes[seat % playerPalettes.length],
      )}
    />
  );
}

/** 発表の何人目か。人が変わるたびに読み上げる。 */
export function RevealCounter({ stage, count }: { stage: Revealing; count: number }) {
  return <Readout role="status" label="JUDGING" value={`${stage.index + 1} / ${count}`} />;
}

/** この画面だけ発表を飛ばして最終の結果へ進める。ほかの参加者の発表には影響しない。 */
export function RevealSkip({ compact, onSkip }: { compact?: boolean; onSkip: () => void }) {
  return (
    <Button
      appearance="secondary"
      shape="pill"
      size={compact ? "xs" : "sm"}
      trailingIcon={<SkipIcon size={12} />}
      onClick={onSkip}
    >
      スキップ
    </Button>
  );
}

/**
 * 結果発表の本文。発表する人のお題と提出画像を並べ、5つの指標を順に採点する様子を見せてから、
 * 最終スコアとその時点までに発表した人の中での順位を出す。下に発表の順番の列を出す。
 */
export function ResultReveal({
  battle,
  order,
  stage,
  participantId,
  names,
  icons,
  metrics,
}: {
  battle: BattleSnapshot;
  order: readonly RevealEntry[];
  stage: Revealing;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  metrics: ResultMetrics;
}) {
  const people = { participantId, participantIds: battle.participantIds, names, icons };
  const entry = order[stage.index];
  const name = nameOf(people, entry.participantId);
  const mine = entry.participantId === participantId;
  const revealed = stage.index + (stage.phase === "score" ? 1 : 0);
  const ranks = getInterimRanks(order, revealed);
  const judging = stage.phase === "judging";
  return (
    <Stack>
      {stage.phase === "call" && (
        <RevealCall
          key={entry.participantId}
          label={
            stage.index === order.length - 1 && order.length > 1
              ? "AND THE LAST ONE"
              : `ENTRY ${String(stage.index + 1).padStart(2, "0")}`
          }
          name={name}
        />
      )}
      <ComparisonStage
        first={
          <Stack space="compact">
            <Text as="p" align="center" variant="label.supporting">
              <Text variant="eyebrow" tone="muted">
                TOPIC
              </Text>{" "}
              お題
            </Text>
            <Media
              src={battle.topic.imageUrl}
              alt="お題のイラスト"
              aspect="portrait"
              decoration={judging ? <JudgingScan /> : undefined}
            />
          </Stack>
        }
        second={
          <Stack space="compact">
            <Text as="p" align="center" variant="label.supporting">
              <Text variant="eyebrow" tone="muted">
                SUBMITTED
              </Text>{" "}
              {name} の提出画像
            </Text>
            <Media
              key={entry.participantId}
              src={entry.imageUrl}
              alt={`${name}さんの提出画像`}
              aspect="portrait"
              entering
              decoration={judging ? <JudgingScan /> : undefined}
            />
          </Stack>
        }
      >
        <Surface appearance="card" padding="content">
          <Stack space="compact">
            <Cluster justify="between" layout="nowrap">
              <Cluster layout="nowrap">
                <PersonAvatar people={people} id={entry.participantId} />
                <Stack space="tight">
                  <Text variant="eyebrow.strong" tone="accent">
                    {stage.phase === "score" ? "SCORE" : "NOW JUDGING"}
                  </Text>
                  <Heading level={2} size="panel">
                    {name}
                    {mine && (
                      <Text variant="inherit" tone="accent">
                        （あなた）
                      </Text>
                    )}
                  </Heading>
                </Stack>
              </Cluster>
              <Text variant="caption" tone="supporting">
                {stage.index + 1} / {order.length}
              </Text>
            </Cluster>
            <JudgingSteps stage={stage} entry={entry} metrics={metrics} />
            {/* 点数の段階の内容だけを読み上げる。指標ごとの切り替わりは読み上げない。 */}
            <div aria-live="polite" aria-atomic="true">
              {stage.phase === "score" && (
                <ScoreReveal
                  key={entry.participantId}
                  name={name}
                  entry={entry}
                  rank={ranks.get(entry.participantId) ?? 1}
                  revealed={revealed}
                  late={stage.phaseMs > countUpMs}
                />
              )}
            </div>
          </Stack>
        </Surface>
      </ComparisonStage>
      <AvatarGroup
        label="発表の順番"
        presentation="expanded"
        members={order.map((item, index) => {
          const itemName = nameOf(people, item.participantId);
          const current = item.participantId === participantId;
          const rank = ranks.get(item.participantId);
          const state =
            index < stage.index ? "complete" : index === stage.index ? "active" : "pending";
          return {
            id: item.participantId,
            name: current ? `${itemName}（あなた）` : itemName,
            displayName: itemName,
            current,
            state,
            detail: index < revealed ? "採点済み" : state === "active" ? "採点中" : "待機中",
            value: index < revealed ? item.total.toFixed(1) : undefined,
            marker:
              rank === undefined ? undefined : { value: String(rank), label: `現在${rank}位` },
            avatar: <PersonAvatar people={people} id={item.participantId} />,
          };
        })}
      />
    </Stack>
  );
}

/** 5つの指標を順に「採点中→済み」にし、済んだ指標から点を出す。モデル名は出さない。 */
function JudgingSteps({
  stage,
  entry,
  metrics,
}: {
  stage: Revealing;
  entry: RevealEntry;
  metrics: ResultMetrics;
}) {
  const done =
    stage.phase === "score" ? scoringMetrics.length : stage.phase === "judging" ? stage.step : 0;
  const active = stage.phase === "judging" ? stage.step : -1;
  const points = metrics.status === "loaded" ? metrics.metrics : null;
  return (
    <Stack space="compact">
      <Text variant="label.supporting">
        {stage.phase === "call"
          ? "まもなく採点を始めます"
          : stage.phase === "judging"
            ? `${scoringMetrics[stage.step].label}を採点しています`
            : "採点が終わりました"}
      </Text>
      <Progress
        label="採点の進み具合"
        value={
          ((done + (stage.phase === "judging" ? stage.stepProgress : 0)) * 100) /
          scoringMetrics.length
        }
        presentation="track"
        tone="gradient"
        striped={stage.phase === "judging"}
      />
      <ProgressList
        label="採点の様子"
        groups={[
          {
            id: "similarity",
            label: "再現度",
            value: stage.phase === "score" ? entry.similarity.toFixed(1) : undefined,
            items: scoringMetrics.map((metric, index) => {
              const point = points?.[metric.key];
              return {
                id: metric.key,
                label: metric.label,
                state: index < done ? "complete" : index === active ? "active" : "pending",
                progress: index === active ? stage.stepProgress * 100 : undefined,
                value:
                  index < done && point !== undefined
                    ? point === null
                      ? "対象外"
                      : point.toFixed(1)
                    : undefined,
              };
            }),
          },
        ]}
      />
    </Stack>
  );
}

/** 0から`target`までを`durationMs`かけて数え上げる。`animate`が`false`なら最初から`target`。 */
function useCountUp(target: number, durationMs: number, animate: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!animate) return undefined;
    let frame = 0;
    const start = performance.now();
    const step = (time: number) => {
      const progress = Math.min(1, Math.max(0, (time - start) / durationMs));
      setValue(target * (1 - (1 - progress) ** 4));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, animate]);
  return animate ? value : target;
}

/** 最終スコアの数え上げと、発表した人の中での順位。再現度と、取ったボーナスも添える。 */
function ScoreReveal({
  name,
  entry,
  rank,
  revealed,
  late,
}: {
  name: string;
  entry: RevealEntry;
  rank: number;
  revealed: number;
  /** 点数の段階の途中から開いた。数え上げずに最終の値を出す。 */
  late: boolean;
}) {
  const [animate] = useState(!late);
  const shown = useCountUp(entry.total, countUpMs, animate);
  const settled = shown === entry.total;
  const bonuses = [
    entry.speedBonus ? `最速提出ボーナス +${entry.speedBonus}` : null,
    entry.generationBonus ? `最少生成ボーナス +${entry.generationBonus}` : null,
  ].filter((bonus) => bonus !== null);
  return (
    <Stack space="tight">
      <Cluster justify="between" layout="nowrap">
        <Text variant="numeric.score" aria-hidden="true">
          {shown.toFixed(1)}
          <Text variant="caption" tone="muted">
            pt
          </Text>
        </Text>
        {settled && (
          <StampIn animate={animate}>
            <Readout
              presentation="stamp"
              tone={rank === 1 ? "primary" : "neutral"}
              label={rank === 1 ? "TOP" : "RANK"}
              value={`現在 ${rank}位`}
            />
          </StampIn>
        )}
      </Cluster>
      {settled && (
        <>
          <Text as="p" variant="caption" tone="supporting">
            {name}さん {entry.total.toFixed(1)}pt・発表した{revealed}人中 現在{rank}位
          </Text>
          <Text as="p" variant="caption" tone="supporting">
            {[`再現度 ${entry.similarity.toFixed(1)}`, ...bonuses].join("・")}
          </Text>
        </>
      )}
    </Stack>
  );
}
