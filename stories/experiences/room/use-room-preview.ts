import { useEffect, useState } from "react";
import {
  advancePreviewRoom,
  setPreviewRules,
  startPreviewBattle,
  togglePreviewReady,
  useParticipant,
  usePreviewRoom,
} from "./room-preview-store";
import type { LobbyModel, RoomRules } from "./room-presentation";
export function useRoomPreview(code: string) {
  const room = usePreviewRoom(code),
    me = useParticipant();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => {
      const time = Date.now();
      advancePreviewRoom(code, time);
      setNow(time);
    };
    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [code]);
  const member = room?.members.find((m) => m.id === me?.id);
  const model: LobbyModel | null =
    room && member
      ? {
          code,
          isHost: room.hostId === member.id,
          hostId: room.hostId,
          players: (room.battle?.members ?? room.members).map((m) => ({
            ...m,
            isMe: m.id === member.id,
          })),
          rules: room.battle?.rules ?? room.rules,
          countdown:
            room.countdownAt === null
              ? null
              : now - room.countdownAt >= 2700
                ? "START!"
                : Math.max(1, 3 - Math.floor(Math.max(0, now - room.countdownAt) / 900)),
        }
      : null;
  return {
    model,
    battle: room?.battle ?? null,
    exists: Boolean(room),
    actions: {
      setRules: (rules: RoomRules) => setPreviewRules(code, rules),
      toggleReady: () => togglePreviewReady(code),
      start: () => startPreviewBattle(code),
    },
  };
}
