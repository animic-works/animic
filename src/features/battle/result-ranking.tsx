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

/** 3人以上の対戦の結果。順位の見出し、上位3人の表彰台、全員の順位を表示する。 */
export function RankingResult({
  battle,
  participantId,
  names,
  icons,
  onRematch,
  onTop,
}: {
  battle: BattleSnapshot;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
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
              <ActionGroup align="center">
                <Button shape="pill" size="lg" prominence="raised" onClick={onRematch}>
                  同じメンバーで再戦
                </Button>
                <Button shape="pill" size="lg" appearance="secondary" onClick={onTop}>
                  トップへ戻る
                </Button>
              </ActionGroup>
            </Stack>
          </Container>
        </Stack>
      </LayerItem>
    </Layer>
  );
}
