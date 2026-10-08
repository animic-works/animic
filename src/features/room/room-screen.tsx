import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../components/button";
import { Dialog } from "../../components/dialog";
import { useWipe } from "../../components/transition";
import { BattleView } from "../battle/battle-view";
import { getBattleScreen } from "../battle/battle-screen";
import { ResultView } from "../battle/result-view";
import { connectRoom } from "./room-connection";
import type { BattleOptions } from "./battle-options";
import { RoomLobby } from "./room-lobby";
import type { RoomSnapshot } from "./room-state";

// 通常どおりつながっている状態（画面を止めない）。
const SILENT = new Set(["接続中…", "接続済み"]);
// 一時的な状態（画面は残したまま知らせる）。
const TEMPORARY = new Set(["再接続中…", "受信した情報を確認できませんでした。"]);

/** セッションの失効・退出・ルームの終了など、接続を続けられない状態か。 */
function isConnectionEnded(status: string) {
  return !SILENT.has(status) && !TEMPORARY.has(status);
}

// 同じルームURL上で待機・対戦・結果の表示を切り替える。状態はWebSocketで受け取る。
export function RoomScreen({
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
  const navigate = useNavigate();
  const wipe = useWipe();
  const [room, setRoom] = useState(initial);
  const [connection, setConnection] = useState("接続中…");
  const [dismissedBattleId, setDismissedBattleId] = useState<string | null>(null);
  // 自分で退出したときの切断は、理由のダイアログを出さずに移動する。
  const [leaving, setLeaving] = useState(false);

  useEffect(() => connectRoom(initial, setRoom, setConnection), [initial]);

  const target = useMemo(
    () => getBattleScreen(room.battle, participantId, dismissedBattleId),
    [room.battle, participantId, dismissedBattleId],
  );
  // 表示する画面の種類。種類が変わるときだけ帯の演出を挟み、演出中は切り替え前の画面を残す。
  const [shown, setShown] = useState(target);
  const advancing = useRef(false);
  useEffect(() => {
    if (shown.kind === target.kind || advancing.current) return;
    advancing.current = true;
    void wipe
      .wipeTo(() => setShown(target))
      .finally(() => {
        advancing.current = false;
      });
  }, [shown.kind, target, wipe]);
  // 同じ種類のままなら最新の状態を、演出中は覆われた切り替え前の画面を描く。
  const screen = shown.kind === target.kind ? target : shown;

  // 接続を続けられないときは、古い状態の画面を残さずに理由だけを出す。
  if (isConnectionEnded(connection) && !leaving) {
    return (
      <Dialog
        open
        onOpenChange={() => undefined}
        role="alertdialog"
        density="compact"
        title="ルームとの接続が切れました"
        description={connection}
        footer={
          <Button asChild size="md" fullWidth>
            <a href="/">トップへ戻る</a>
          </Button>
        }
      />
    );
  }

  const names = new Map(room.members.map((member): [string, string] => [member.id, member.name]));

  return (
    <>
      {screen.kind === "lobby" && (
        <RoomLobby
          room={room}
          participantId={participantId}
          inviteUrl={inviteUrl}
          battleOptions={battleOptions}
          connection={connection}
          previousBattleId={screen.previousBattleId}
          waitingForNext={screen.waitingForNext}
          onLeaving={setLeaving}
          onLeft={() => void wipe.wipeTo(() => navigate({ to: "/" }))}
        />
      )}
      {screen.kind === "battle" && (
        <BattleView
          code={room.code}
          battle={screen.battle}
          stage={screen.stage}
          participantId={participantId}
          names={names}
        />
      )}
      {screen.kind === "result" && (
        <ResultView
          code={room.code}
          battle={screen.battle}
          participantId={participantId}
          names={names}
          // 再戦は種類の変化（結果→ロビー）として扱い、上の効果が帯の演出を出す。
          onRematch={() => setDismissedBattleId(screen.battle.id)}
          onTop={() => void wipe.wipeTo(() => navigate({ to: "/" }))}
        />
      )}
    </>
  );
}
