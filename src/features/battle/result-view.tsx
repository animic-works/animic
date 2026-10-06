import type { MouseEvent } from "react";

import type { AvatarPlayer } from "../../components/avatar";
import { playerColor } from "../../components/avatar";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Text } from "../../components/text";
import { TopBar } from "../../components/top-bar";
import { Entrance } from "../../components/transition";
import { ActionRow, ArtFrame, ArtImage, ArtMissing } from "./battle-parts";
import { getDifficulty } from "./battle-labels";
import { getResultEntries, getResultHeadline } from "./battle-outcome";
import type { ResultEntry } from "./battle-outcome";
import type { BattleSnapshot } from "./battle-state";
import {
  MissingNote,
  PlayerCard,
  PlayerTotal,
  PlayerWho,
  ResultBoardGrid,
  ResultBurst,
  ResultMain,
  ResultNote,
  ResultTopic,
  Verdict,
} from "./result-parts";

// 参加者1人の結果。提出画像・未提出・最終スコア・WINNERを見せる。
// 最終スコアの計算式が決まるまで、採点の total をそのまま最終スコアにする（total暫定）。
function ParticipantCard({
  entry,
  name,
  role,
  color,
}: {
  entry: ResultEntry;
  name: string;
  role: string;
  color: AvatarPlayer;
}) {
  const total =
    entry.total === null ? null : entry.total.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  return (
    <PlayerCard winner={entry.winner}>
      <PlayerWho name={name} role={role} player={color} />
      {!entry.submitted ? (
        <ArtFrame variant="missing">
          <ArtMissing>未提出</ArtMissing>
        </ArtFrame>
      ) : entry.imageUrl ? (
        <ArtFrame variant="submission">
          <ArtImage src={entry.imageUrl} alt={`${name}さんの提出画像`} />
        </ArtFrame>
      ) : (
        <ArtFrame variant="submission">
          <ArtMissing>提出済み</ArtMissing>
        </ArtFrame>
      )}
      {total !== null ? <PlayerTotal label="最終スコア" value={total} /> : null}
      {!entry.submitted ? <MissingNote>時間内に提出されませんでした</MissingNote> : null}
    </PlayerCard>
  );
}

/** 確定した対戦の結果画面。 */
export function ResultView({
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
  const result = battle.result;
  if (!result) return null;

  const opponentId = battle.participantIds.find((id) => id !== participantId);
  const opponentName = (opponentId && names.get(opponentId)) || "相手";
  const headline = getResultHeadline(result, participantId, opponentName);
  const [mine, theirs] = getResultEntries(battle, participantId);
  const difficulty = getDifficulty(battle.settings.difficulty);
  const colorOf = (id: string): AvatarPlayer => playerColor(battle.participantIds.indexOf(id));

  function handleTop(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onTop();
  }

  return (
    <>
      <ResultBurst />
      <TopBar logoSrc="/animic-logo.svg" logoHref="/" onLogoClick={handleTop} variant="result">
        <Badge variant="outline">
          ルーム{" "}
          <Text as="code" variant="code">
            {code}
          </Text>
        </Badge>
      </TopBar>
      <ResultMain>
        <Entrance order={0}>
          <Verdict
            eyebrow="RESULT"
            title={headline.title}
            sub={headline.message}
            tone={headline.title === "YOU WIN!" ? "win" : "lose"}
          />
        </Entrance>
        <ResultBoardGrid>
          {mine ? (
            <Entrance order={1}>
              <ParticipantCard
                entry={mine}
                name={names.get(participantId) ?? "あなた"}
                role="あなた"
                color={colorOf(participantId)}
              />
            </Entrance>
          ) : null}
          <Entrance order={2}>
            <ResultTopic meta={`お題・${difficulty.label}・${battle.settings.durationSeconds}秒`}>
              <ArtFrame variant="topicResult" tag="THEME">
                <ArtImage src={battle.topic.imageUrl} alt="お題のイラスト" />
              </ArtFrame>
            </ResultTopic>
          </Entrance>
          {theirs ? (
            <Entrance order={3}>
              <ParticipantCard
                entry={theirs}
                name={opponentName}
                role="対戦相手"
                color={colorOf(theirs.participantId)}
              />
            </Entrance>
          ) : null}
        </ResultBoardGrid>
        <Entrance order={4}>
          <ActionRow>
            <Button size="lg" onClick={onRematch}>
              同じメンバーで再戦
            </Button>
            <Button variant="secondary" size="lg" onClick={onTop}>
              トップへ戻る
            </Button>
          </ActionRow>
        </Entrance>
        <ResultNote>
          ※ 最終スコアの計算式は準備中です。いまは再現度をそのまま最終スコアにしています
        </ResultNote>
      </ResultMain>
    </>
  );
}
