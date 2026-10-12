import type { Ref } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Avatar } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Container } from "@animic/react/container";
import { Heading } from "@animic/react/heading";
import { Layer, LayerItem } from "@animic/react/layer";
import { ButtonLink } from "@animic/react/link";
import { Podium } from "@animic/react/podium";
import { RecordItem, RecordList } from "@animic/react/record-list";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { accountIconAvatar, type AccountIcon } from "../account/account-icon";
import { playerPalettes } from "../room/room-presentation";
import { XLogoIcon } from "../shared/icons";
import { getRanking, ordinal, type RankingEntry } from "./battle-outcome";
import type { BattleSnapshot } from "./battle-state";
import { ResultBreakdown, type ResultMetricsStore } from "./result-breakdown";
import {
  Crown,
  ResultBurst,
  ResultConfetti,
  ResultRankingReveal,
  VerdictReveal,
} from "./visuals/result-artwork";

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

/** 順位と最終スコアを入れたXの投稿画面。ルームや結果のURLは入れず、トップページへ案内する。 */
function shareUrl(rank: number, count: number, total: number | null) {
  const score = total === null ? "" : `（${formatTotal(total)}pt）`;
  const params = new URLSearchParams({
    text: `Animicの対戦で${count}人中${rank}位になりました！${score}`,
    url: "https://animic.party/",
  });
  return `https://x.com/intent/tweet?${params}`;
}

/**
 * 最終の結果。人数にかかわらず、順位の見出し、上位3人の表彰台、全員の順位と、順位の付いた全員のスコアの内訳を表示する。
 */
export function RankingResult({
  battle,
  participantId,
  names,
  icons,
  metrics,
  rematchRef,
  onRematch,
  onTop,
}: {
  battle: BattleSnapshot;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  metrics: ResultMetricsStore;
  rematchRef?: Ref<HTMLButtonElement>;
  onRematch: () => void;
  onTop: () => void;
}) {
  const ranking = getRanking(battle, participantId);
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
  const { result } = battle;
  const submitted = battle.mySubmission?.status === "submitted";
  const winner = first?.rank === 1 ? first : undefined;
  const tied = me?.rank != null && ranking.filter((entry) => entry.rank === me.rank).length > 1;
  // 1対1で採点できずに勝負不成立になった相手は、提出しているが画像を公開しない。
  const hiddenImage =
    ranking.length === 2 && result?.kind === "no-contest" && result.reason === "scoring-failed";
  const title = !winner
    ? "NO GAME"
    : me?.rank == null
      ? submitted
        ? "NO SCORE"
        : "NO ENTRY"
      : `${ordinal(me.rank)}${me.rank <= 3 ? "!" : ""}`;
  const message = !winner
    ? result?.kind === "no-contest" && result.reason === "scoring-failed"
      ? "採点できなかったため、勝負不成立です"
      : "誰も提出しなかったため、勝負不成立です"
    : me?.rank == null
      ? `${submitted ? "採点できなかったため、順位はありません" : "今回は提出できませんでした"}。1位は ${name(winner)} さん`
      : result?.kind === "win" && result.reason === "opponent-not-submitted"
        ? "ほかの人が提出しなかったため、あなたが1位です"
        : me.rank === 1
          ? `${tied ? "同点で1位！" : "あなたが1位！"} ${ranking.length}人の中でいちばんお題に近い1枚でした`
          : `あなたは ${ranking.length}人中 ${me.rank}位${tied ? "（同点）" : ""}。1位は ${name(winner)} さん（${formatTotal(winner.total)}pt）`;
  const podiumItems = ranking.flatMap((entry, index) =>
    entry.rank !== null && entry.imageUrl
      ? [
          {
            id: entry.participantId,
            src: entry.imageUrl,
            label: `${name(entry)}さんの提出画像`,
            avatar: avatar(entry),
            name: (
              <Text variant="inherit">
                {name(entry)}
                {entry.participantId === participantId && (
                  <Text variant="inherit" tone="accent">
                    （あなた）
                  </Text>
                )}
              </Text>
            ),
            value: formatTotal(entry.total),
            rank: entry.rank,
            decoration: index === 0 ? <Crown animate /> : undefined,
          },
        ]
      : [],
  );
  return (
    <Layer>
      <LayerItem placement="background">
        <ResultBurst animate />
        {me?.rank === 1 && <ResultConfetti />}
      </LayerItem>
      <LayerItem placement="content">
        <Stack space="section">
          <Stack align="center" space="compact">
            <Text variant="eyebrow.strong" tone="accent">
              FINAL RESULT
            </Text>
            <VerdictReveal animate>
              <Heading level={1} size="statement" emphasis="offset">
                {title}
              </Heading>
            </VerdictReveal>
            <Text as="p" align="center" wrap="balance" variant="label" tone="muted">
              {message}
            </Text>
          </Stack>
          <Podium entering items={podiumItems} />
          <Container size="summary" gutter="none">
            <Stack space="section">
              <ResultRankingReveal>
                <RecordList label="順位" entering>
                  {ranking.map((entry) => (
                    <RecordItem
                      density="compact"
                      key={entry.participantId}
                      emphasis={entry.participantId === participantId}
                      leading={<Text variant="numeric.supporting">{entry.rank ?? "—"}</Text>}
                      image={entry.imageUrl}
                      avatar={avatar(entry)}
                      supplement={
                        hiddenImage &&
                        entry.participantId !== participantId && (
                          <Text variant="caption" tone="muted">
                            採点できなかったため、画像は公開されません
                          </Text>
                        )
                      }
                      value={<Text variant="numeric.supporting">{formatTotal(entry.total)}</Text>}
                    >
                      <Text variant="label">
                        {name(entry)}
                        {entry.participantId === participantId && "（あなた）"}
                      </Text>
                    </RecordItem>
                  ))}
                </RecordList>
              </ResultRankingReveal>
              <ActionGroup layout="responsive" align="center">
                <Button
                  ref={rematchRef}
                  shape="pill"
                  size="lg"
                  prominence="raised"
                  onClick={onRematch}
                >
                  同じメンバーで再戦
                </Button>
                {me?.rank != null && (
                  <ButtonLink
                    href={shareUrl(me.rank, ranking.length, me.total)}
                    target="_blank"
                    appearance="inverse"
                    shape="pill"
                    size="lg"
                    leadingIcon={<XLogoIcon />}
                    aria-label="結果をシェア（X）"
                  >
                    結果をシェア
                  </ButtonLink>
                )}
                <Button shape="pill" size="lg" appearance="secondary" onClick={onTop}>
                  トップへ戻る
                </Button>
              </ActionGroup>
              {battle.scores && (
                <Stack>
                  {ranking.flatMap((entry) => {
                    const score = battle.scores?.find(
                      (item) => item.participantId === entry.participantId,
                    );
                    return score
                      ? [
                          <ResultBreakdown
                            key={entry.participantId}
                            battle={battle}
                            score={score}
                            name={name(entry)}
                            mine={entry.participantId === participantId}
                            metrics={metrics.get(entry.participantId)}
                            onRetry={() => metrics.retry(entry.participantId)}
                          />,
                        ]
                      : [];
                  })}
                </Stack>
              )}
            </Stack>
          </Container>
        </Stack>
      </LayerItem>
    </Layer>
  );
}
