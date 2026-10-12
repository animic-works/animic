import { useState } from "react";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Badge } from "@animic/react/badge";
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
import { getScoreRank } from "../scoring/score-rank";
import { shortenName } from "./display-name";
import { scoringMetrics, type ScoringMetricsReport } from "../scoring/scoring-metrics";
import type { BattleSnapshot } from "./battle-state";
import {
  getInterimRanks,
  getRevealBonuses,
  getScoreCount,
  revealTiming,
  scoreCountTiming,
  type RevealEntry,
  type RevealStage,
} from "./result-presentation";
import { useAnimationElapsed } from "./use-reveal-clock";
import { JudgingScan, RankBanner, RevealCall, StampColumn, StampIn } from "./visuals/result-reveal";

type Revealing = Extract<RevealStage, { kind: "reveal" }>;

/** 発表の何人目か。ヘッダーで人が変わるたびに読み上げる。 */
export function RevealCounter({ stage, count }: { stage: Revealing; count: number }) {
  return <Readout role="status" label="JUDGING" value={`${stage.index + 1} / ${count}`} />;
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
}: {
  battle: BattleSnapshot;
  order: readonly RevealEntry[];
  stage: Revealing;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  metrics: ReadonlyMap<string, ScoringMetricsReport>;
}) {
  const people = { participantId, names, icons, participantIds: battle.participantIds };
  const entry = order[stage.index];
  const mine = entry.participantId === participantId;
  const name = nameOf(people, entry.participantId);
  const revealed = stage.index + (stage.phase === "score" ? 1 : 0);
  const ranks = getInterimRanks(order, revealed);
  const last = stage.index === order.length - 1 && order.length > 1;
  // 点数を数え終えたら（数え終える時刻はボーナスの数で決まる）、順位を出す。
  const rankShown =
    stage.phase === "score" &&
    getScoreCount(
      entry.similarity,
      getRevealBonuses(entry).map((bonus) => bonus.points),
      stage.offsetMs - revealTiming.introMs - revealTiming.judgingMs,
    ).settled;
  return (
    <Stack space="compact">
      {stage.phase === "intro" && (
        <RevealCall
          key={entry.participantId}
          entry={last ? "AND THE LAST ONE" : `ENTRY ${String(stage.index + 1).padStart(2, "0")}`}
          name={shortenName(name, 10)}
        />
      )}
      <ComparisonStage
        size="compact"
        first={
          <Stack align="center" space="compact">
            {/* 対戦条件はヘッダーの札に出すため、ここでは「お題」だけにする。 */}
            <Badge tone="surface">お題</Badge>
            <Media src={battle.topic.imageUrl} alt="お題のイラスト" aspect="portrait" />
          </Stack>
        }
        second={
          <Stack align="center" space="compact">
            {/* 長い名前は、札が画像の幅に収まるよう名前の部分を「…」で縮める（全体の名前は`title`で伝える）。 */}
            <Badge tone="surface" truncate title={`${name} さん`}>
              <Text variant="inherit">{name}</Text>
              <Text variant="inherit">さん</Text>
            </Badge>
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
        <Stack space="compact">
          <Surface appearance="card" padding="content">
            <Stack space="compact">
              <Cluster justify="between" layout="nowrap">
                <Cluster layout="nowrap">
                  <PersonAvatar people={people} id={entry.participantId} />
                  <Stack space="tight">
                    <Text variant="eyebrow.strong" tone="accent">
                      {stage.phase === "score" ? "SCORE" : "NOW JUDGING"}
                    </Text>
                    {/* 長い名前は1行に収まるよう縮め、採点パネルの大きさを変えない。 */}
                    <Heading level={2} size="panel" title={name}>
                      {shortenName(name, mine ? 7 : 9)}
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
              <JudgingSteps stage={stage} metrics={metrics.get(entry.participantId) ?? null} />
              <ScoreFigure
                key={entry.participantId}
                entry={entry}
                phase={stage.phase}
                startMs={stage.offsetMs - revealTiming.introMs - revealTiming.judgingMs}
              />
            </Stack>
          </Surface>
          {/*
          点数を数え終えたら、パネルのすぐ下に、発表した人の中での順位を押し込むように出す。
          場所は最初から取っておき、ほかの要素の位置を変えない。
        */}
          <RankPop
            key={entry.participantId}
            shown={rankShown}
            rank={ranks.get(entry.participantId) ?? 1}
            revealed={revealed}
          />
        </Stack>
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
            valueTone: getScoreRank(item.total).text,
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
 * 読み込めていれば、済みの指標の点を出す。
 */
function JudgingSteps({
  stage,
  metrics,
}: {
  stage: Revealing;
  metrics: ScoringMetricsReport | null;
}) {
  const done =
    stage.phase === "score" ? scoringMetrics.length : stage.phase === "judging" ? stage.step : 0;
  const active = stage.phase === "judging" ? stage.step : -1;
  // 指標をいくつ採点し終えたか（採点中の指標の進みを含む）で、その人の採点の進み具合を出す。
  const progress =
    ((done + (stage.phase === "judging" ? stage.stepProgress : 0)) / scoringMetrics.length) * 100;
  return (
    <Stack space="compact">
      <Stack space="tight">
        <Text variant="label.supporting">
          {stage.phase === "judging"
            ? `${scoringMetrics[stage.step].label}を採点しています`
            : stage.phase === "score"
              ? "採点が終わりました"
              : "まもなく採点を始めます"}
        </Text>
        <Progress
          label="採点の進み具合"
          value={progress}
          presentation="track"
          tone="gradient"
          striped={stage.phase === "judging"}
        />
      </Stack>
      <ProgressList
        label="採点の様子"
        groups={[
          {
            id: "similarity",
            label: "指標",
            // 再現度は、点数の欄の総合の点数と内訳で示すため、一覧の見出しは出さない。
            labelVisibility: "hidden",
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
                valueTone: index < done && point != null ? getScoreRank(point).text : undefined,
              };
            }),
          },
        ]}
      />
    </Stack>
  );
}

/**
 * 総合の最終スコアの欄。点数の段階で再現度を数え上げた後、取ったボーナスをスタンプで1つずつ押して加える。
 * スタンプは点数の右の決まった大きさの列に積み、採点パネルの大きさを変えない。途中の順位はパネルの下に出す。
 * 点数はランクの色で出す（数えている間も最終の値の色）。点数の段階の途中から開いたときは、その時点から数える。
 */
function ScoreFigure({
  entry,
  phase,
  startMs,
}: {
  entry: RevealEntry;
  phase: Revealing["phase"];
  startMs: number;
}) {
  const bonuses = getRevealBonuses(entry);
  const end = scoreCountTiming.bonusStartMs + bonuses.length * scoreCountTiming.bonusGapMs;
  // 点数の段階に入った時点（途中から開いたときはその時点）から数え、時計の刻みで数え直さない。
  const [start, setStart] = useState<number | null>(phase === "score" ? startMs : null);
  if (phase === "score" && start === null) setStart(startMs);
  const elapsed = useAnimationElapsed(start ?? end, end);
  const scoring = start !== null;
  const count = getScoreCount(
    entry.similarity,
    bonuses.map((bonus) => bonus.points),
    scoring ? elapsed : 0,
  );
  const animate = scoring && start < end;
  const shown = bonuses.slice(0, scoring ? count.bonuses : 0);
  const rankStyle = getScoreRank(entry.total);
  // 点数の欄全体を読み上げの領域にし、ボーナスのスタンプと順位が出るたびに、増えた分だけを読み上げる。
  return (
    <div aria-live="polite">
      <Cluster justify="between" layout="nowrap">
        <Stack space="tight">
          <Text variant="eyebrow.strong" tone="muted">
            FINAL SCORE
          </Text>
          {/* 採点が終わるまでは薄い「00.0」を出しておき、点数の段階でそこから数え上げる。 */}
          <Text
            variant="numeric.score"
            tone={scoring ? rankStyle.text : "subtle"}
            aria-hidden="true"
          >
            <Text variant="inherit" emphasis={scoring ? rankStyle.emphasis : undefined}>
              {scoring ? (count.settled ? entry.total : count.value).toFixed(1) : "00.0"}
            </Text>
            {/* 単位は数字の大きさに合わせた大きさにし、数字との間を少し空ける。 */}
            <Text variant="numeric.fraction" tone="muted">
              {"\u00a0"}pt
            </Text>
          </Text>
          {/* 点数を数え終えたら、点数の下の決まった場所に、発表した人の中での順位を押し込むように出す。 */}
        </Stack>
        {/*
          取ったボーナスは同じ大きさのスタンプで上から積む。色は点数のランクの色と紛れないよう、
          最速提出は紫、最少生成は藍にする。
        */}
        <StampColumn>
          {shown.map((bonus, index) => (
            <StampIn
              key={bonus.id}
              animate={animate}
              slot={index === 0 ? 0 : 1}
              count={shown.length}
            >
              <Readout
                presentation="stamp"
                fill
                tone={bonus.id === "speed" ? "violet" : "indigo"}
                label={bonus.label}
                value={`+${bonus.points.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}`}
              />
            </StampIn>
          ))}
        </StampColumn>
      </Cluster>
    </div>
  );
}

/** 採点パネルの下の、途中の順位の帯。開いた時点ですでに出ている（途中から開いた）ときは、動きなしで出す。 */
function RankPop({ shown, rank, revealed }: { shown: boolean; rank: number; revealed: number }) {
  const [late] = useState(shown);
  return (
    <RankBanner shown={shown} animate={!late} top={rank === 1}>
      <Cluster justify="center" layout="nowrap">
        <Text variant="numeric.supporting" tone={rank === 1 ? "primary" : "default"}>
          {rank === 1 ? "TOP! " : "現在 "}
          {rank}位
        </Text>
        <Text variant="caption" tone="muted">
          発表した{revealed}人中
        </Text>
      </Cluster>
    </RankBanner>
  );
}
