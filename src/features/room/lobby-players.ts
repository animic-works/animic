import type { RoomSnapshot } from "./room-state";

/** ロビーの参加者をホストを先頭に並べ、準備の状態と開始できるかを求める。ホストは常に準備済みとして数える。 */
export function getLobbyPlayers(room: RoomSnapshot, participantId: string) {
  const players = room.members
    .toSorted((a, b) => Number(b.id === room.hostId) - Number(a.id === room.hostId))
    .map((member) => ({
      ...member,
      isMe: member.id === participantId,
      isHost: member.id === room.hostId,
      ready: member.id === room.hostId || member.ready,
      /** 入室順の位置。アバターの色を参加者ごとに固定する。 */
      seat: room.members.findIndex((item) => item.id === member.id),
    }));
  const connected = players.filter((player) => player.connected);
  const readyCount = connected.filter((player) => player.ready).length;
  return {
    players,
    me: players.find((player) => player.isMe),
    readyCount,
    connectedCount: connected.length,
    allReady: connected.length >= 2 && readyCount === connected.length,
    /** 接続中で準備がまだの人。開始前の確認に出す。 */
    waiting: connected.filter((player) => !player.ready),
  };
}
export type LobbyPlayer = ReturnType<typeof getLobbyPlayers>["players"][number];
