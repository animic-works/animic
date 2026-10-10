import { useEffect, useRef, useState } from "react";
import type { BattleSettings } from "../battle/battle-state";
import { startBattle } from "../battle/battle.functions";
import { defaultBattleSettings, type BattleOptions } from "./battle-options";
import type { RoomSnapshot } from "./room-state";
import { leaveRoom, setReady, setRoomSettings } from "./room.functions";
import { useRoomSettings } from "./use-room-settings";

const rulesSaveError = "ルールを保存できませんでした。選び直してください。";

/** ロビーの操作（ルールの変更・準備・開始・退出）と、実行中・失敗の状態。 */
export function useLobbyActions({
  room,
  isHost,
  battleOptions,
  previousBattleId,
  waitingForNext,
  onLeaving,
  onLeft,
}: {
  room: RoomSnapshot;
  isHost: boolean;
  battleOptions: BattleOptions;
  previousBattleId: string | null;
  waitingForNext: boolean;
  onLeaving: (value: boolean) => void;
  onLeft: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const defaultsSent = useRef(false);
  const { code } = room;
  const {
    settings: rules,
    save,
    flush,
  } = useRoomSettings(room, defaultBattleSettings(battleOptions), previousBattleId);

  // ホストが入ったルームにまだ設定がなければ、既定の条件を保存する。
  useEffect(() => {
    if (!isHost || room.settings || defaultsSent.current || waitingForNext) return;
    defaultsSent.current = true;
    void save(defaultBattleSettings(battleOptions)).catch(() => setError(rulesSaveError));
  }, [isHost, room.settings, waitingForNext, battleOptions, save]);

  async function act(action: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "操作できませんでした。もう一度お試しください。",
      );
    } finally {
      setPending(false);
    }
  }

  return {
    rules,
    pending,
    error,
    changeRules: (settings: BattleSettings) => {
      setError(undefined);
      void save(settings).catch(() => setError(rulesSaveError));
    },
    start: () => {
      void act(async () => {
        await flush();
        await setRoomSettings({ data: { code, settings: rules, previousBattleId } });
        const result = await startBattle({ data: { code, settings: rules, previousBattleId } });
        if (result.error) throw new Error(result.error);
      });
    },
    setReady: (ready: boolean) => {
      void act(async () => {
        await setReady({ data: { code, ready } });
      });
    },
    leave: () => {
      void act(async () => {
        onLeaving(true);
        try {
          await leaveRoom({ data: { code } });
          onLeft();
        } catch (cause) {
          onLeaving(false);
          throw cause;
        }
      });
    },
  };
}
