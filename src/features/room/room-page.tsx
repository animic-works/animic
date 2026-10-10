import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@animic/react/button";
import { Dialog } from "@animic/react/dialog";
import { useToast } from "@animic/react/toast";
import { usePageTransition } from "../navigation/page-transition-provider";
import { BattlePage } from "../battle/battle-page";
import { ResultPage } from "../battle/result-page";
import { getBattleScreen } from "../battle/battle-screen";
import { LobbyPage } from "./lobby-page";
import { useRoomConnection } from "./use-room-connection";
import type { BattleOptions } from "./battle-options";
import type { RoomSnapshot } from "./room-state";
const silent = new Set(["接続中…", "接続済み"]);
const temporary = new Set(["再接続中…", "受信した情報を確認できませんでした。"]);
export function RoomPage({
  initial,
  participantId,
  inviteUrl,
  battleOptions,
}: {
  initial: RoomSnapshot;
  participantId: string;
  inviteUrl: string;
  battleOptions: BattleOptions;
}) {
  const received = useRoomConnection(initial);
  const { room, connection } = received;
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { transition, transitioning, navigate } = usePageTransition();
  const toast = useToast();
  useEffect(() => {
    if (temporary.has(connection)) toast.show({ title: connection });
  }, [connection, toast]);
  const target = useMemo(
    () => getBattleScreen(room.battle, participantId, dismissed),
    [room.battle, participantId, dismissed],
  );
  const [shown, setShown] = useState({ screen: target, at: received.at, entering: false });
  // 同じ画面の配信は更新し、別画面に移る間は最後に表示したsnapshotを保持する。
  if (shown.screen.kind === target.kind && (shown.screen !== target || shown.at !== received.at))
    setShown({ screen: target, at: received.at, entering: shown.entering });
  const changing = useRef(false);
  useEffect(() => {
    if (shown.screen.kind === target.kind) return;
    if (changing.current || transitioning) return;
    changing.current = true;
    void transition(() => {
      setShown({
        screen: target,
        at: received.at,
        entering:
          shown.screen.kind === "lobby" &&
          target.kind === "battle" &&
          target.stage === "generating",
      });
    })
      .catch(() => toast.show({ title: "画面を切り替えられませんでした" }))
      .finally(() => {
        changing.current = false;
      });
  }, [target, shown, received.at, transition, transitioning, toast]);
  const scrolledScreen = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (scrolledScreen.current === shown.screen.kind) return;
    scrolledScreen.current = shown.screen.kind;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [shown.screen.kind]);
  const current = target.kind === shown.screen.kind ? { screen: target, at: received.at } : shown;
  const { screen } = current;
  const names = new Map(room.members.map((member) => [member.id, member.name]));
  const icons = new Map(room.members.map((member) => [member.id, member.icon]));
  if (!leaving && !silent.has(connection) && !temporary.has(connection))
    return (
      <Dialog
        open
        onOpenChange={() => {}}
        title="ルームとの接続が切れました"
        description={connection}
        closeButton={false}
        dismissible={false}
        presentation="centered"
        size="compact"
      >
        <Button shape="pill" onClick={() => navigate("/")}>
          トップへ戻る
        </Button>
      </Dialog>
    );
  if (screen.kind === "battle")
    return (
      <BattlePage
        key={screen.battle.id}
        code={room.code}
        battle={screen.battle}
        stage={screen.stage}
        receivedAt={current.at}
        entering={shown.entering}
        names={names}
        icons={icons}
        participantId={participantId}
      />
    );
  if (screen.kind === "result")
    return (
      <ResultPage
        code={room.code}
        battle={screen.battle}
        names={names}
        icons={icons}
        participantId={participantId}
        onRematch={() => setDismissed(screen.battle.id)}
        onTop={() => navigate("/")}
      />
    );
  return (
    <LobbyPage
      room={room}
      participantId={participantId}
      inviteUrl={inviteUrl}
      battleOptions={battleOptions}
      previousBattleId={screen.previousBattleId}
      waitingForNext={screen.waitingForNext}
      onLeaving={setLeaving}
      onLeft={() => navigate("/")}
    />
  );
}
