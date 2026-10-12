import { useRef, useState } from "react";
import type { BattleSettings } from "../battle/battle-state";
import type { RoomSnapshot } from "./room-state";
import { setRoomSettings } from "./room.functions";

/** 選択は即時に表示し、保存は入力順に送る。配信が保存版に追いついたらサーバーの値を使う。 */
export function useRoomSettings(
  room: RoomSnapshot,
  defaults: BattleSettings,
  previousBattleId: string | null,
) {
  const [choice, setChoice] = useState<{
    value: BattleSettings;
    request: number;
    version: number | null;
  }>();
  const sequence = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const settings =
    choice && (choice.version === null || room.version < choice.version)
      ? choice.value
      : (room.settings ?? defaults);

  async function save(next: BattleSettings) {
    const request = ++sequence.current;
    setChoice({ value: next, request, version: null });
    const task = queue.current.then(() =>
      setRoomSettings({ data: { code: room.code, settings: next, previousBattleId } }),
    );
    // 個別の失敗は呼び出し元へ返し、次の保存や開始を待つキューには残さない。
    queue.current = task.then(
      () => undefined,
      () => undefined,
    );
    try {
      const version = await task;
      setChoice((current) => (current?.request === request ? { ...current, version } : current));
    } catch (error) {
      setChoice((current) => (current?.request === request ? undefined : current));
      throw error;
    }
  }

  return { settings, save, flush: () => queue.current };
}
