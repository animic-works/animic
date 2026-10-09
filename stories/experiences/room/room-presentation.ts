import type { levels } from "../../../src/features/room/room-presentation";
type Level = keyof typeof levels;
export interface RoomRules {
  level: Level;
  duration: 60 | 90 | 120;
  limit: 0 | 3 | 5 | 10;
}
export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
  isMe: boolean;
}
export interface LobbyModel {
  code: string;
  isHost: boolean;
  hostId: string;
  players: readonly RoomPlayer[];
  rules: RoomRules;
  countdown: number | "START!" | null;
}
export interface LobbyActions {
  setRules: (rules: RoomRules) => void;
  toggleReady: () => void;
  start: () => void;
}
