import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePageTransition } from "../../../src/features/navigation/page-transition-provider";
import { Page } from "@animic/react/page";
import { Center } from "@animic/react/center";
import { Stack } from "@animic/react/stack";
import { Heading } from "@animic/react/heading";
import { Link } from "@animic/react/link";
import { Text } from "@animic/react/text";
import { useBrowserReady } from "../browser-store";
import { keepBattleResult, useStoredResult } from "../battle/result-storage";
import { BattlePage } from "../battle/battle-page";
import type { BattleResult } from "../battle/battle-presentation";
import { ResultPage } from "../battle/result-page";
import { useBattlePreview } from "../battle/use-battle-preview";
import { LobbyPage } from "./lobby-page";
import type { LobbyModel } from "./room-presentation";
import { useRoomPreview } from "./use-room-preview";
import { finishPreviewBattle, rematchPreviewRoom } from "./room-preview-store";
export function RoomPage({ code }: { code: string }) {
  const room = useRoomPreview(code);
  const ready = useBrowserReady();
  if (!ready) return <Page />;
  if (!room.model)
    return (
      <Page>
        <Center>
          <Stack align="center">
            <Heading level={1} size="title">
              ルームが見つかりません
            </Heading>
            <Text>ルームコードを確認してください。</Text>
            <Link href="/">トップへ戻る</Link>
          </Stack>
        </Center>
      </Page>
    );
  return <RoomSession code={code} room={room} model={room.model} />;
}
function RoomSession({
  code,
  room,
  model,
}: {
  code: string;
  room: ReturnType<typeof useRoomPreview>;
  model: LobbyModel;
}) {
  const { transition, transitioning } = usePageTransition();
  const [shownBattle, setShownBattle] = useState(room.battle);
  const [entering, setEntering] = useState(false);
  const stored = useStoredResult(shownBattle?.id ?? "");
  const target = room.battle ? `${room.battle.id}:${room.battle.finished}` : "lobby";
  const shown = shownBattle ? `${shownBattle.id}:${shownBattle.finished}` : "lobby";
  const previousScreen = useRef(shown);
  useLayoutEffect(() => {
    if (previousScreen.current === shown) return;
    previousScreen.current = shown;
    // 同じURL内の画面切替はRouterのスクロール管理を通らない。
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [shown]);
  useEffect(() => {
    if (target === shown || transitioning) return;
    void transition(() => {
      setShownBattle(room.battle);
      setEntering(Boolean(room.battle && !room.battle.finished));
    });
  }, [target, shown, room.battle, transition, transitioning]);
  if (shownBattle) {
    if (!shownBattle.members.some((member) => member.id === model.players.find((p) => p.isMe)?.id))
      return (
        <Page>
          <Center>
            <Text>対戦が終わるまでお待ちください</Text>
          </Center>
        </Page>
      );
    if (shownBattle.finished)
      return stored ? (
        <ResultPage
          key={stored.result.id}
          result={stored.result}
          initiallyCompleted={stored.completed}
          canRematch={model.isHost}
          onRematch={() => rematchPreviewRoom(code)}
        />
      ) : (
        <Page>
          <Center>
            <Stack>
              <Text>この対戦の結果を読み込めませんでした。</Text>
              <Link href="/">トップへ戻る</Link>
            </Stack>
          </Center>
        </Page>
      );
    return (
      <BattleContainer
        key={shownBattle.id}
        room={model}
        battle={shownBattle}
        entering={entering}
        onFinish={(result) => {
          keepBattleResult(result);
          finishPreviewBattle(code);
        }}
      />
    );
  }
  return (
    <LobbyPage
      model={{ ...model, countdown: room.battle ? "START!" : model.countdown }}
      actions={room.actions}
    />
  );
}

function BattleContainer({
  room,
  battle,
  onFinish,
  entering,
}: {
  room: LobbyModel;
  entering: boolean;
  battle: { id: string; startedAt: number };
  onFinish: (result: BattleResult) => void;
}) {
  const value = useBattlePreview(room, battle, onFinish);
  return <BattlePage model={value.model} actions={value.actions} entering={entering} />;
}
