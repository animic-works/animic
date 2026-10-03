import { playerColor } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { ActionRow, ArtFrame, ArtImage, ArtMissing } from "@animic/react/battle";
import { Button } from "@animic/react/button";
import { Icon } from "@animic/react/icon";
import { TopBar } from "@animic/react/lobby/top-bar";
import {
  Breakdown,
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
} from "@animic/react/result";
import { Text } from "@animic/react/text";
import { toast } from "@animic/react/toast";
import { Entrance } from "@animic/react/transition";
import type { MouseEvent } from "react";

import type { RoomSnapshot } from "../room/room-state";
import { DIFFICULTY_LABELS } from "./battle-labels";
import type { BattleSnapshot, ParticipantStatus } from "./battle-state";

// 参加者1人の結果。採点機能ができるまで、再現度と最終スコアは「—」にする
function ParticipantCard({
  participant,
  isMe,
  winner,
  name,
  color,
}: {
  participant: ParticipantStatus | null;
  isMe: boolean;
  winner: boolean;
  name: string;
  color: ReturnType<typeof playerColor>;
}) {
  const image = participant?.submittedImageUrl ?? null;
  return (
    <PlayerCard winner={winner}>
      <PlayerWho name={name} role={isMe ? "あなた" : "対戦相手"} player={color} />
      {participant?.submitted ? (
        <ArtFrame variant="submission">
          {image ? (
            <ArtImage src={image} alt={`${name}さんの提出画像`} />
          ) : (
            <ArtMissing>画像を読み込めません</ArtMissing>
          )}
        </ArtFrame>
      ) : (
        <ArtFrame variant="missing">
          <ArtMissing>未提出</ArtMissing>
        </ArtFrame>
      )}
      <PlayerTotal label="最終スコア" value="—" />
      {participant?.submitted ? (
        <Breakdown
          rows={[
            { term: "再現度", percent: 0, value: "—", tone: "pink" },
            {
              term: "提出速度",
              percent: participant.eligibleForSpeedBonus ? 100 : 0,
              value: participant.eligibleForSpeedBonus ? "時間内" : "時間切れ",
              tone: "cyan",
            },
            {
              term: "生成回数",
              percent: Math.min(100, participant.generationCount * 20),
              value: `${participant.generationCount}回`,
              tone: "yellow",
            },
          ]}
        />
      ) : (
        <MissingNote>時間内に提出されませんでした</MissingNote>
      )}
    </PlayerCard>
  );
}

// 結果発表: 勝敗、お題を挟んだ2人のカード、再戦・シェア
export function ResultScreen({
  room,
  battle,
  meId,
  onRematch,
  onHome,
}: {
  room: RoomSnapshot;
  battle: BattleSnapshot;
  meId: string | null;
  onRematch: () => void;
  onHome: () => void;
}) {
  const result = battle.result;
  const nameOf = (id: string) =>
    room.members.find((member) => member.id === id)?.name ?? "対戦相手";
  const colorOf = (id: string) => playerColor(room.members.findIndex((member) => member.id === id));
  const me = battle.participants.find((item) => item.participantId === meId) ?? null;
  const them = battle.participants.find((item) => item.participantId !== meId) ?? null;
  const themName = them ? nameOf(them.participantId) : "対戦相手";

  const outcome: "win" | "lose" | "none" =
    result?.kind === "win" ? (result.winnerId === meId ? "win" : "lose") : "none";
  const TITLES = {
    win: ["YOU WIN!", `${themName} さんに勝ちました！`],
    lose: ["YOU LOSE…", `${themName} さんの勝ちです。次こそは！`],
    none: ["NO GAME", "どちらも提出しなかったため、勝負不成立です"],
  } as const;
  const [title, sub] = TITLES[outcome];

  function home(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onHome();
  }

  return (
    <>
      <ResultBurst />
      <TopBar logoSrc="/animic-logo.svg" logoHref="/" onLogoClick={home} variant="result">
        <Badge variant="outline">
          ルーム{" "}
          <Text as="code" variant="code">
            {room.code}
          </Text>
        </Badge>
      </TopBar>
      <ResultMain>
        <Entrance order="0">
          <Verdict
            eyebrow="RESULT"
            title={title}
            sub={sub}
            tone={outcome === "win" ? "win" : "lose"}
          />
        </Entrance>
        <ResultBoardGrid>
          <Entrance order="1">
            <ParticipantCard
              participant={me}
              isMe
              winner={outcome === "win"}
              name={meId ? nameOf(meId) : "あなた"}
              color={meId ? colorOf(meId) : "1"}
            />
          </Entrance>
          <Entrance order="2">
            <ResultTopic
              meta={`お題・${DIFFICULTY_LABELS[battle.settings.difficulty]}・${battle.settings.durationSeconds}秒`}
            >
              <ArtFrame variant="topicResult" tag="THEME">
                <ArtImage src={battle.topic.imageUrl} alt="お題のイラスト" />
              </ArtFrame>
            </ResultTopic>
          </Entrance>
          <Entrance order="3">
            <ParticipantCard
              participant={them}
              isMe={false}
              winner={outcome === "lose"}
              name={themName}
              color={them ? colorOf(them.participantId) : "2"}
            />
          </Entrance>
        </ResultBoardGrid>
        <Entrance order="4">
          <ActionRow>
            <Button size="lg" onClick={onRematch}>
              同じメンバーで再戦
            </Button>
            <Button
              variant="inverse"
              size="lg"
              leadingIcon={<Icon name="x" size="md" />}
              onClick={() => toast("SNSへのシェアは準備中です")}
            >
              結果をシェア
            </Button>
            <Button variant="secondary" size="lg" onClick={onHome}>
              トップへ戻る
            </Button>
          </ActionRow>
        </Entrance>
        <ResultNote>
          ※ スコアの計算は準備中です。採点機能ができるまで、再現度と最終スコアは表示されません
        </ResultNote>
      </ResultMain>
    </>
  );
}
