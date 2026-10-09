import { describe, expect, it } from "vite-plus/test";
import { getLobbyPlayers } from "./lobby-players";
import type { RoomSnapshot } from "./room-state";

function room(members: RoomSnapshot["members"]): RoomSnapshot {
  return {
    code: "ABCDEFGH",
    settings: null,
    battle: null,
    version: 1,
    hostId: "h",
    members,
    closed: false,
  };
}

describe("ロビーの参加者", () => {
  const members = [
    { id: "a", name: "A", ready: false, connected: true },
    { id: "h", name: "H", ready: false, connected: true },
    { id: "b", name: "B", ready: true, connected: false },
  ];
  it("ホストを先頭に並べ、ホストを準備済みとして数え、入室順の位置を保つ", () => {
    const lobby = getLobbyPlayers(room(members), "a");
    expect(lobby.players.map((player) => [player.id, player.ready, player.seat])).toEqual([
      ["h", true, 1],
      ["a", false, 0],
      ["b", true, 2],
    ]);
    expect(lobby.me?.id).toBe("a");
  });
  it("接続中の人だけで準備の数と開始の条件を求める", () => {
    const lobby = getLobbyPlayers(room(members), "a");
    expect([lobby.readyCount, lobby.connectedCount, lobby.allReady]).toEqual([1, 2, false]);
    expect(lobby.waiting.map((player) => player.id)).toEqual(["a"]);
    const ready = getLobbyPlayers(room(members.map((m) => ({ ...m, ready: true }))), "a");
    expect(ready.allReady).toBe(true);
  });
});
