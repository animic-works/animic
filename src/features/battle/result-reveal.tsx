import { useState } from "react";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { ComparisonStage } from "@animic/react/comparison-stage";
import { Heading } from "@animic/react/heading";
import { Media } from "@animic/react/media";
import { ProgressList } from "@animic/react/progress-list";
import { Readout } from "@animic/react/readout";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { accountIconAvatar, type AccountIcon } from "../account/account-icon";
import { levels, playerPalettes } from "../room/room-presentation";
import { scoringMetrics, type ScoringMetricsReport } from "../scoring/scoring-metrics";
import { SkipIcon } from "../shared/icons";
import type { BattleSnapshot } from "./battle-state";
import {
  getInterimRanks,
  revealTiming,
  type RevealEntry,
  type RevealStage,
} from "./result-presentation";
import { useCountUp } from "./use-reveal-clock";
import { JudgingScan, RevealCall, StampIn } from "./visuals/result-reveal";

type Revealing = Extract<RevealStage, { kind: "reveal" }>;
const countUpMs = 1_200;

/** 発表の何人目か。ヘッダーで人が変わるたびに読み上げる。 */
export function RevealCounter({ stage, count }: { stage: Revealing; count: number }) {
  return <Readout role="status" label="JUDGING" value={`${stage.index + 1} / ${count}`} />;
}

/** 3倍速とスキップ。どちらもこの画面だけの操作で、ほかの参加者の発表には影響しない。 */
export function RevealControls({
  rate,
  compact,
  onRateChange,
  onSkip,
}: {
  rate: 1 | 3;
  compact?: boolean;
  onRateChange: (rate: 1 | 3) => void;
  onSkip: () => void;
}) {
  const size = compact ? "xs" : "sm";
  return (
    <>
      <Button
        appearance="outlined"
        shape="pill"
        size={size}
        aria-pressed={rate === 3}
        aria-label="3倍速"
        onClick={() => onRateChange(rate === 3 ? 1 : 3)}
      >
        ×3
      </Button>
      <Button
        appearance="secondary"
        shape="pill"
        size={size}
        trailingIcon={<SkipIcon size={12} />}
        onClick={onSkip}
      >
        スキップ
      </Button>
    </>
  );
}

type People = {
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  participantIds: readonly string[];
};
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

/**
 * 結果発表の本文。提出した人を1人ずつ取り上げ、お題と提出画像を並べて採点の様子を見せてから、最終スコアと途中の順位を出す。
 * 採点パネルは段階が変わっても同じ構成・高さに保ち、点数の欄は採点が終わるまで空けておく。
 * 指標の点は読み込めた人の分だけ出す（`metrics`）。
 */
export function ResultReveal({
  battle,
  order,
  stage,
  participantId,
  names,
  icons,
  metrics,
  rate,
}: {
  battle: BattleSnapshot;
  order: readonly RevealEntry[];
  stage: Revealing;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  metrics: ReadonlyMap<string, ScoringMetricsReport>;
  rate: 1 | 3;
}) {
  const people = { participantId, names, icons, participantIds: battle.participantIds };
  const entry = order[stage.index];
  const mine = entry.participantId === participantId;
  const name = nameOf(people, entry.participantId);
  const revealed = stage.index + (stage.phase === "score" ? 1 : 0);
  const ranks = getInterimRanks(order, revealed);
  const last = stage.index === order.length - 1 && order.length > 1;
  return (
    <Stack space="compact">
      {stage.phase === "intro" && (
        <RevealCall
          key={entry.participantId}
          entry={last ? "AND THE LAST ONE" : `ENTRY ${String(stage.index + 1).padStart(2, "0")}`}
          name={name}
        />
      )}
      <ComparisonStage
        first={
          <Stack align="center" space="compact">
            <Badge tone="surface">
              お題・{levels[battle.settings.difficulty].label}・{battle.settings.durationSeconds}秒
            </Badge>
            <Media src={battle.topic.imageUrl} alt="お題のイラスト" aspect="portrait" />
          </Stack>
        }
        second={
          <Stack align="center" space="compact">
            <Badge tone="surface">{name} さんの提出画像</Badge>
            <Media
              key={entry.participantId}
              src={entry.imageUrl}
              alt={`${name}さんの提出画像`}
              aspect="portrait"
              entering
              decoration={stage.phase === "judging" ? <JudgingScan /> : undefined}
            />
          </Stack>
        }
      >
        <Surface appearance="card" padding="content">
          <Stack>
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
              <Stack space="tight" align="center">
                <Text variant="numeric.supporting">
                  {stage.index + 1} / {order.length}
                </Text>
                {/* 発表の順番の列と同じ数え方で、まだ発表していない人数を出す。 */}
                <Text variant="caption" tone="supporting">
                  未発表 {order.length - stage.index - 1}人
                </Text>
              </Stack>
            </Cluster>
            <JudgingSteps
              stage={stage}
              metrics={metrics.get(entry.participantId) ?? null}
              similarity={entry.similarity}
            />
            <Stack space="tight">
              {stage.phase === "score" ? (
                <ScoreFigure
                  key={entry.participantId}
                  total={entry.total}
                  rank={ranks.get(entry.participantId) ?? 1}
                  late={stage.offsetMs - revealTiming.introMs - revealTiming.judgingMs > countUpMs}
                  rate={rate}
                />
              ) : (
                // 採点が終わるまでは、点数と同じ大きさの薄い数字で欄を空けておく。
                <Text variant="numeric.score" tone="subtle" aria-hidden="true">
                  00.0
                </Text>
              )}
              <Text as="p" variant="caption" tone="supporting">
                {stage.phase === "score"
                  ? scoreDetail(entry)
                  : stage.phase === "judging"
                    ? `${scoringMetrics[stage.step].label}を採点しています`
                    : "まもなく採点を始めます"}
              </Text>
              {/* 点数の段階の内容だけを読み上げる。採点の様子（指標ごとの切り替わり）は読み上げない。 */}
              <div aria-live="polite" aria-atomic="true">
                <Text as="p" variant="caption" tone="muted">
                  {stage.phase === "score"
                    ? `${name}さん ${entry.total.toFixed(1)}pt・発表した${revealed}人中 現在${ranks.get(entry.participantId) ?? 1}位`
                    : "\u00a0"}
                </Text>
              </div>
            </Stack>
          </Stack>
        </Surface>
      </ComparisonStage>
      <AvatarGroup
        label="発表の順番"
        presentation="expanded"
        members={order.map((item, index) => {
          const state =
            index < revealed ? "complete" : index === stage.index ? "active" : "pending";
          const rank = ranks.get(item.participantId);
          const itemName = nameOf(people, item.participantId);
          const current = item.participantId === participantId;
          return {
            id: item.participantId,
            name: current ? `${itemName}（あなた）` : itemName,
            displayName: itemName,
            current,
            state,
            detail: state === "complete" ? "発表済み" : state === "active" ? "発表中" : "未発表",
            value: state === "complete" ? item.total.toFixed(1) : undefined,
            marker:
              rank === undefined ? undefined : { value: String(rank), label: `現在${rank}位` },
            avatar: <PersonAvatar people={people} id={item.participantId} />,
          };
        })}
      />
    </Stack>
  );
}

/**
 * 5つの指標を順に「採点中→済み」にする。モデル名は出さない。
 * 読み込めていれば、済みの指標の点と、点数の段階で再現度を出す。
 */
function JudgingSteps({
  stage,
  metrics,
  similarity,
}: {
  stage: Revealing;
  metrics: ScoringMetricsReport | null;
  similarity: number;
}) {
  const done =
    stage.phase === "score" ? scoringMetrics.length : stage.phase === "judging" ? stage.step : 0;
  const active = stage.phase === "judging" ? stage.step : -1;
  return (
    <ProgressList
      label="採点の様子"
      groups={[
        {
          id: "similarity",
          label: "再現度",
          value: stage.phase === "score" ? similarity.toFixed(1) : undefined,
          items: scoringMetrics.map((metric, index) => {
            const point = metrics?.scores[metric.key];
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
  );
}

/** 再現度と、取ったボーナスの内訳。取れなかった・その対戦で定義していないボーナスは出さない（全体は最終の結果の内訳で見る）。 */
function scoreDetail(entry: RevealEntry) {
  return [
    `再現度 ${entry.similarity.toFixed(1)}`,
    entry.speedBonus ? `最速提出 +${entry.speedBonus}` : null,
    entry.generationBonus ? `最少生成 +${entry.generationBonus}` : null,
  ]
    .filter(Boolean)
    .join("・");
}

/** 最終スコアの数え上げと、数え終えたときに押す途中の順位のスタンプ。 */
function ScoreFigure({
  total,
  rank,
  late,
  rate,
}: {
  total: number;
  rank: number;
  late: boolean;
  rate: 1 | 3;
}) {
  // 点数の段階の途中から開いたときは、数え上げずに最終の値を出す。
  const [animate] = useState(!late);
  const [duration] = useState(countUpMs / rate);
  const shown = useCountUp(total, duration, animate);
  return (
    <Cluster justify="between" layout="nowrap">
      <Text variant="numeric.score" aria-hidden="true">
        {shown.toFixed(1)}
        <Text variant="caption" tone="muted">
          pt
        </Text>
      </Text>
      {shown === total && (
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
  );
}
