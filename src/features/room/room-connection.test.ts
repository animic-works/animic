import { describe, expect, it } from "vite-plus/test";
import { readRoomMessage } from "./room-connection";

const room = {
  code: "ABCDEFGH",
  settings: null,
  battle: null,
  battleCount: 0,
  version: 3,
  hostId: "host",
  members: [{ id: "host", name: "ホスト", ready: false, icon: null, connected: true }],
  closed: false,
};

describe("配信のメッセージ", () => {
  it("ルームの状態の形に合うものを読む", () => {
    expect(readRoomMessage(JSON.stringify(room))).toEqual({ kind: "room", room });
  });
  it("JSONとして読めないものと、ルームの状態の形に合わないものを確認できなかったものにする", () => {
    expect(readRoomMessage("{")).toEqual({ kind: "invalid" });
    expect(readRoomMessage(JSON.stringify({ ...room, version: "3" }))).toEqual({ kind: "invalid" });
    expect(readRoomMessage("null")).toEqual({ kind: "invalid" });
  });
  it("生存確認の応答と文字列でないものは読まない", () => {
    expect(readRoomMessage("pong")).toEqual({ kind: "ignored" });
    expect(readRoomMessage(new ArrayBuffer(1))).toEqual({ kind: "ignored" });
  });
});
