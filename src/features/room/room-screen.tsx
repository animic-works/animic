import { toast } from "@animic/react/toast";
import { useWipe } from "@animic/react/transition";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { syncServerClock } from "../battle/battle-clock";
import { BattleScreen } from "../battle/battle-screen";
import { ResultScreen } from "../battle/result-screen";
import { connectRoom } from "./room-connection";
import { RoomLobby } from "./room-lobby";
import type { RoomSnapshot } from "./room-state";

type View = "lobby" | "battle" | "result";

// 画面を切り替えたら、描画後にページの先頭から見せる（モックはページ遷移で先頭に戻る）。
// 切り替えごとに置き直す（key）ことで、表示のたびに一度だけ動く
function ScrollToTop() {
  useEffect(() => {
    scrollTo({ top: 0 });
  }, []);
  return null;
}

// 同じルームURL上で待機・対戦・結果の表示を切り替える。状態はWebSocketで受け取る
export function RoomScreen({
  initial,
  inviteUrl,
  meId,
}: {
  initial: RoomSnapshot;
  inviteUrl: string;
  meId: string | null;
}) {
  const navigate = useNavigate();
  const [room, setRoom] = useState(initial);
  const [connection, setConnection] = useState("接続中…");
  useEffect(() => {
    if (initial.battle) syncServerClock(initial.battle.serverTime);
    let previous = initial;
    return connectRoom(
      initial,
      (next) => {
        if (next.battle) syncServerClock(next.battle.serverTime);
        // 相手が提出したら知らせる（自分が提出済みのときは待機の表示があるので出さない）
        const mine = next.battle?.mySubmission;
        for (const item of next.battle?.participants ?? []) {
          const before = previous.battle?.participants.find(
            (p) => p.participantId === item.participantId,
          );
          if (
            item.participantId !== meId &&
            item.submitted &&
            before &&
            !before.submitted &&
            !mine
          ) {
            const name = next.members.find((m) => m.id === item.participantId)?.name ?? "対戦相手";
            toast(`${name} さんが提出しました`);
          }
        }
        previous = next;
        setRoom(next);
      },
      setConnection,
    );
  }, [initial, meId]);

  const battle = room.battle;
  const [view, setView] = useState<View>(battle ? (battle.result ? "result" : "battle") : "lobby");
  const wipe = useWipe();
  const wipeRef = useRef(wipe);
  useEffect(() => {
    wipeRef.current = wipe;
  });

  // 対戦の開始・確定に合わせて画面を切り替える。切り替えは帯の演出を挟む
  const battleId = battle?.id ?? null;
  const decided = Boolean(battle?.result);
  // 結果が確定したら、採点中の表示を少し見せてから結果へ
  const scoring = decided && view === "battle";
  useEffect(() => {
    if (!battleId) return undefined;
    if (!decided && view !== "battle") {
      void wipeRef.current.wipeTo(() => setView("battle"));
      return undefined;
    }
    if (decided && view === "battle") {
      const timer = setTimeout(() => void wipeRef.current.wipeTo(() => setView("result")), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [battleId, decided, view]);

  return (
    <>
      <ScrollToTop key={view} />
      {view === "battle" && battle ? (
        <BattleScreen room={room} battle={battle} meId={meId} scoring={scoring} />
      ) : view === "result" && battle?.result ? (
        <ResultScreen
          room={room}
          battle={battle}
          meId={meId}
          onRematch={() => void wipe.wipeTo(() => setView("lobby"))}
          onHome={() => void wipe.wipeTo(() => navigate({ to: "/" }))}
        />
      ) : (
        <RoomLobby
          room={room}
          inviteUrl={inviteUrl}
          meId={meId}
          connection={connection}
          onLeft={() => void navigate({ to: "/" })}
        />
      )}
    </>
  );
}
