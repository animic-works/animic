import { ActionGroup } from "@animic/react/action-group";
import { AppFrame } from "@animic/react/app-frame";
import { Avatar } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { ComparisonStage } from "@animic/react/comparison-stage";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Page } from "@animic/react/page";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { AppBrand } from "../shared/app-brand";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import { levels, playerPalettes } from "../room/room-presentation";
import { getResultEntries, getResultHeadline, type ResultEntry } from "./battle-outcome";
import type { BattleSnapshot } from "./battle-state";
import { ResultBurst, ResultConfetti } from "./visuals/result-artwork";
function ParticipantResult({
  entry,
  name,
  mine,
  seat,
}: {
  entry: ResultEntry;
  name: string;
  mine: boolean;
  seat: number;
}) {
  return (
    <Surface appearance="card" padding="content">
      <Stack>
        <Cluster>
          <Avatar
            name={name}
            fallback={Array.from(name)[0]}
            palette={playerPalettes[seat % playerPalettes.length]}
          />
          <Heading level={2} size="title">
            {name}
          </Heading>
          <Badge>{mine ? "あなた" : "対戦相手"}</Badge>
          {entry.winner && <Badge tone="highlight">WINNER</Badge>}
        </Cluster>
        {entry.imageUrl ? (
          <Media src={entry.imageUrl} alt={`${name}さんの提出画像`} aspect="portrait" />
        ) : (
          <MediaPlaceholder label={entry.submitted ? "提出済み" : "未提出"}>
            <Text>{entry.submitted ? "提出済み" : "未提出"}</Text>
          </MediaPlaceholder>
        )}
        {entry.total !== null && (
          <Stack space="tight" align="center">
            <Text variant="caption">最終スコア</Text>
            <Text variant="numeric.display">
              {entry.total.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
              <Text variant="caption">pt</Text>
            </Text>
          </Stack>
        )}
        {!entry.submitted && (
          <Text variant="caption" tone="muted">
            時間内に提出されませんでした
          </Text>
        )}
      </Stack>
    </Surface>
  );
}
export function ResultPage({
  code,
  battle,
  participantId,
  names,
  onRematch,
  onTop,
}: {
  code: string;
  battle: BattleSnapshot;
  participantId: string;
  names: Map<string, string>;
  onRematch: () => void;
  onTop: () => void;
}) {
  if (!battle.result) return null;
  const opponentId = battle.participantIds.find((id) => id !== participantId);
  const headline = getResultHeadline(
    battle.result,
    participantId,
    names.get(opponentId ?? "") ?? "相手",
  );
  const [mine, theirs] = getResultEntries(battle, participantId);
  const participant = (entry: ResultEntry) => (
    <ParticipantResult
      entry={entry}
      name={
        names.get(entry.participantId) ??
        (entry.participantId === participantId ? "あなた" : "相手")
      }
      mine={entry.participantId === participantId}
      seat={battle.participantIds.indexOf(entry.participantId)}
    />
  );
  return (
    <Page
      decoration={
        <>
          <GridBackdrop />
          <ResultBurst animate />
          {battle.result.kind === "win" && battle.result.winnerId === participantId && (
            <ResultConfetti />
          )}
        </>
      }
    >
      <AppFrame
        brand={<AppBrand />}
        context={
          <Badge>
            ルーム <CodeDisplay value={code} presentation="inline" />
          </Badge>
        }
      >
        <Stack space="section">
          <Stack align="center" space="compact">
            <Text variant="eyebrow.strong" tone="accent">
              RESULT
            </Text>
            <Heading level={1} size="statement">
              {headline.title}
            </Heading>
            <Text align="center">{headline.message}</Text>
          </Stack>
          <ComparisonStage first={mine && participant(mine)} second={theirs && participant(theirs)}>
            <Stack align="center">
              <Badge>
                お題・{levels[battle.settings.difficulty].label}・{battle.settings.durationSeconds}
                秒
              </Badge>
              <Media
                src={battle.topic.imageUrl}
                alt="お題のイラスト"
                aspect="portrait"
                size="preview"
              />
            </Stack>
          </ComparisonStage>
          <ActionGroup align="center">
            <Button shape="pill" size="lg" prominence="raised" onClick={onRematch}>
              同じメンバーで再戦
            </Button>
            <Button shape="pill" size="lg" appearance="secondary" onClick={onTop}>
              トップへ戻る
            </Button>
          </ActionGroup>
        </Stack>
      </AppFrame>
    </Page>
  );
}
