import { ActionGroup } from "@animic/react/action-group";
import { Avatar } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Container } from "@animic/react/container";
import { Heading } from "@animic/react/heading";
import { Layer, LayerItem } from "@animic/react/layer";
import { Podium } from "@animic/react/podium";
import { RecordItem, RecordList } from "@animic/react/record-list";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { accountIconAvatar, type AccountIcon } from "../account/account-icon";
import { playerPalettes } from "../room/room-presentation";
import { getRanking, ordinal, type RankingEntry } from "./battle-outcome";
import type { BattleSnapshot } from "./battle-state";
import { getScoreRank } from "../scoring/score-rank";
import { shortenName } from "./display-name";
import { scoringMetrics, type ScoringMetricsReport } from "../scoring/scoring-metrics";
import { ResultBreakdownButton, useResultMetrics } from "./result-breakdown";
import { ResultShareLink } from "./result-share";
import {
  Crown,
  PodiumLaurels,
  ResultConfetti,
  ResultRankingReveal,
  VerdictReveal,
  WinnerSparkles,
} from "./visuals/result-artwork";

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

/**
 * 順位の一覧の行に添える、その人の要点。再現度と、取ったボーナスと、いちばん高い指標。
 * 全体の内訳は行の「内訳」から開く。
 */
function scoreSummary(
  score: NonNullable<BattleSnapshot["scores"]>[number],
  metrics: ScoringMetricsReport | undefined,
) {
  const best = scoringMetrics
    .flatMap((metric) => {
      const point = metrics?.scores[metric.key];
      return point == null ? [] : [{ label: metric.label, point }];
    })
    .toSorted((a, b) => b.point - a.point)[0];
  const bonus = (score.speedBonus ?? 0) + (score.generationBonus ?? 0);
  const bonusText =
    bonus > 0 ? `・ボーナス +${bonus.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}` : "";
  return [
    `再現度 ${score.similarity.toFixed(1)}${bonusText}`,
    ...(best ? [`最高 ${best.label} ${best.point.toFixed(1)}`] : []),
  ];
}

/** 3人以上の対戦の結果。順位の見出し、上位3人の表彰台、全員の順位と、順位の付いた全員のスコアの内訳を表示する。 */
export function RankingResult({
  code,
  battle,
  participantId,
  names,
  icons,
  animate,
  onRematch,
  onTop,
}: {
  code: string;
  battle: BattleSnapshot;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  /** `false`なら（結果発表が終わった後に開いた場合など）登場の演出を再生せずに出す。 */
  animate: boolean;
  onRematch: () => void;
  onTop: () => void;
}) {
  const ranking = getRanking(battle, participantId);
  // 一覧の各行に、その人の指標の要点を添える。
  const metrics = useResultMetrics(
    code,
    battle.id,
    battle.scores?.map((score) => score.participantId) ?? [],
  );
  const me = ranking.find((entry) => entry.participantId === participantId);
  const [first] = ranking;
  const name = (entry: RankingEntry) =>
    names.get(entry.participantId) ?? (entry.participantId === participantId ? "あなた" : "参加者");
  const seat = (entry: RankingEntry) => battle.participantIds.indexOf(entry.participantId);
  const avatar = (entry: RankingEntry) => (
    <Avatar
      size="small"
      name={name(entry)}
      fallback={Array.from(name(entry))[0]}
      {...accountIconAvatar(
        icons.get(entry.participantId) ?? null,
        playerPalettes[seat(entry) % playerPalettes.length],
      )}
    />
  );
  const submitted = battle.mySubmission?.status === "submitted";
  const winner = first?.rank === 1 ? first : undefined;
  const title = !winner
    ? "NO GAME"
    : me?.rank == null
      ? submitted
        ? "NO SCORE"
        : "NO ENTRY"
      : `${ordinal(me.rank)}${me.rank <= 3 ? "!" : ""}`;
  const message = !winner
    ? battle.result?.kind === "no-contest" && battle.result.reason === "scoring-failed"
      ? "採点できなかったため、勝負不成立です"
      : battle.result?.kind === "no-contest" && battle.result.reason === "room-closed"
        ? "全員がルームを離れたため、勝負不成立です"
        : "誰も提出しなかったため、勝負不成立です"
    : me?.rank == null
      ? `${submitted ? "採点できなかったため、順位はありません" : "今回は提出できませんでした"}。1位は ${name(winner)} さん`
      : me.rank === 1
        ? `あなたが1位！ ${ranking.length}人の中でいちばんお題に近い1枚でした`
        : `あなたは ${ranking.length}人中 ${me.rank}位。1位は ${name(winner)} さん（${formatTotal(winner.total)}pt）`;
  const podiumItems = ranking.flatMap((entry, index) =>
    entry.rank !== null && entry.imageUrl
      ? [
          {
            id: entry.participantId,
            src: entry.imageUrl,
            label: `${name(entry)}さんの提出画像`,
            avatar: avatar(entry),
            name: (
              <Text variant="inherit" title={name(entry)}>
                {shortenName(name(entry), entry.participantId === participantId ? 4 : 5)}
                {entry.participantId === participantId && (
                  <Text variant="inherit" tone="accent">
                    （あなた）
                  </Text>
                )}
              </Text>
            ),
            value: (
              <Text
                variant="inherit"
                tone={entry.total === null ? undefined : getScoreRank(entry.total).text}
                emphasis={entry.total === null ? undefined : getScoreRank(entry.total).emphasis}
              >
                {formatTotal(entry.total)}
              </Text>
            ),
            rank: entry.rank,
            decoration:
              index === 0 ? (
                <>
                  <WinnerSparkles />
                  <Crown animate={animate} />
                </>
              ) : undefined,
            // 帯の飾りは、黄色の帯（3番目）には紺、ほかには白で描く。
            stepDecoration: <PodiumLaurels tone={index === 2 ? "dark" : "light"} />,
          },
        ]
      : [],
  );
  return (
    <Layer>
      <LayerItem placement="background">
        {animate && me?.rank === 1 && <ResultConfetti />}
      </LayerItem>
      <LayerItem placement="content">
        <Stack space="section">
          <Stack align="center" space="compact">
            <Text variant="eyebrow.display" tone="accent">
              FINAL RESULT
            </Text>
            <VerdictReveal animate={animate}>
              <Heading level={1} size="statement" emphasis="offset">
                {title}
              </Heading>
            </VerdictReveal>
            <Text as="p" align="center" wrap="balance" variant="label" tone="muted">
              {message}
            </Text>
          </Stack>
          <Podium presentation="card" entering={animate} items={podiumItems} />
          {/* 操作は表彰台の下・順位の一覧の上に置き、結果の種類によらず同じ位置にする。 */}
          <ActionGroup align="center">
            <Button
              shape="pill"
              size="lg"
              compactLabel="再戦"
              aria-label="同じメンバーで再戦"
              onClick={onRematch}
            >
              同じメンバーで再戦
            </Button>
            <ResultShareLink battle={battle} participantId={participantId} />
            <Button
              shape="pill"
              size="lg"
              appearance="secondary"
              compactLabel="トップへ"
              aria-label="トップへ戻る"
              onClick={onTop}
            >
              トップへ戻る
            </Button>
          </ActionGroup>
          <Container size="summary" gutter="none">
            <Stack space="section">
              <ResultRankingReveal>
                <RecordList label="順位" entering={animate}>
                  {ranking.map((entry) => {
                    const score = battle.scores?.find(
                      (item) => item.participantId === entry.participantId,
                    );
                    const mine = entry.participantId === participantId;
                    return (
                      <RecordItem
                        density="compact"
                        key={entry.participantId}
                        emphasis={mine}
                        leading={<Text variant="numeric.supporting">{entry.rank ?? "—"}</Text>}
                        image={entry.imageUrl}
                        // 内訳を開く操作は点数の下に置き、どの行でも同じ位置にそろえる（狭い画面でも詳細の文を1行に収める）。
                        value={
                          <Stack space="tight" align="center">
                            <Text
                              variant="numeric.supporting"
                              tone={
                                entry.total === null ? undefined : getScoreRank(entry.total).text
                              }
                            >
                              {formatTotal(entry.total)}
                            </Text>
                            {score && (
                              <ResultBreakdownButton
                                code={code}
                                battle={battle}
                                score={score}
                                name={name(entry)}
                                mine={mine}
                              />
                            )}
                          </Stack>
                        }
                      >
                        <Stack space="tight">
                          <Text variant="label" title={name(entry)}>
                            {shortenName(name(entry), mine ? 5 : 9)}
                            {mine && "（あなた）"}
                          </Text>
                          {score &&
                            scoreSummary(score, metrics.get(entry.participantId)).map((part) => (
                              <Text key={part} variant="caption" tone="supporting">
                                {part}
                              </Text>
                            ))}
                        </Stack>
                      </RecordItem>
                    );
                  })}
                </RecordList>
              </ResultRankingReveal>
            </Stack>
          </Container>
        </Stack>
      </LayerItem>
    </Layer>
  );
}
