import { describe, expect, it } from "vite-plus/test";
import { reconcileRoom, getRoomDeadline } from "./room-state";
import type { RoomState } from "./room-state";

function room(): RoomState {
  return {
    creation: null,
    code: "ABCDEFGH",
    battle: null,
    settings: null,
    version: 1,
    hostId: "host",
    members: [
      { id: "host", name: "ホスト", ready: false },
      { id: "first", name: "先に参加", ready: true },
      { id: "second", name: "後に参加", ready: false },
    ],
    hostDisconnectedUntil: null,
    closesAt: null,
    closed: false,
  };
}

describe("ルームの接続と期限", () => {
  it("ホストの切断から30秒待ち、参加順で引き継ぐ", () => {
    const state = reconcileRoom(room(), new Set(["second", "first"]), 1000);
    expect(reconcileRoom(state, new Set(["second", "first"]), 30_999).hostId).toBe("host");
    const transferred = reconcileRoom(state, new Set(["second", "first"]), 31_000);
    expect(transferred.hostId).toBe("first");
    expect(reconcileRoom(transferred, new Set(["host", "first", "second"]), 32_000).hostId).toBe(
      "first",
    );
  });
  it("猶予内に戻ったホストを古い期限で交代しない", () => {
    const disconnected = reconcileRoom(room(), new Set(["first"]), 1000);
    const returned = reconcileRoom(disconnected, new Set(["host", "first"]), 20_000);
    expect(returned.hostDisconnectedUntil).toBeNull();
    expect(reconcileRoom(returned, new Set(["host", "first"]), 40_000).hostId).toBe("host");
  });
  it("引き継ぎ先がいない間は待ち、接続者が現れたら引き継ぐ", () => {
    const disconnected = reconcileRoom(room(), new Set(), 1000);
    const empty = reconcileRoom(disconnected, new Set(), 31_000);
    expect(empty.hostId).toBe("host");
    expect(reconcileRoom(empty, new Set(["second"]), 32_000).hostId).toBe("second");
  });
  it("全接続がなくなってから30分で閉じ、遅れた再接続でも復活しない", () => {
    const empty = reconcileRoom(room(), new Set(), 1000);
    expect(empty.closesAt).toBe(1_801_000);
    expect(reconcileRoom(empty, new Set(["host"]), 1_801_000).closed).toBe(true);
    const closed = reconcileRoom(empty, new Set(), 1_801_000);
    expect(reconcileRoom(closed, new Set(["host"]), 1_802_000).closed).toBe(true);
  });
  it("誰かが戻った後に全員切断した場合は新しい30分を数える", () => {
    const empty = reconcileRoom(room(), new Set(), 1000);
    const returned = reconcileRoom(empty, new Set(["host"]), 10_000);
    expect(returned.closesAt).toBeNull();
    expect(reconcileRoom(returned, new Set(), 20_000).closesAt).toBe(1_820_000);
    expect(returned.members[1]?.ready).toBe(true);
  });
});

describe("ルームの次の期限", () => {
  it("状態確認直後に閉鎖期限を跨いでも、即時実行を予約する", () => {
    const state = reconcileRoom(room(), new Set(), 1000);
    expect(getRoomDeadline(state, new Set(), 1_801_000)).toBe(1_801_000);
    expect(getRoomDeadline(state, new Set(), 1_801_001)).toBe(1_801_001);
    expect(reconcileRoom(state, new Set(), 1_801_001).closed).toBe(true);
  });
  it("引き継ぎ先がいるときは、跨いだホスト期限も処理する", () => {
    const connected = new Set(["first"]);
    const state = reconcileRoom(room(), connected, 1000);
    expect(getRoomDeadline(state, connected, 31_001)).toBe(31_001);
    expect(reconcileRoom(state, connected, 31_001).hostId).toBe("first");
  });
  it("引き継ぎ先がない期限で即時予約を繰り返さず、閉鎖期限を残す", () => {
    const state = reconcileRoom(room(), new Set(), 1000);
    expect(getRoomDeadline(state, new Set(), 31_001)).toBe(1_801_000);
  });
  it("復帰や閉鎖で不要になった期限を予約しない", () => {
    const state = reconcileRoom(room(), new Set(), 1000);
    const returned = reconcileRoom(state, new Set(["host"]), 10_000);
    expect(getRoomDeadline(returned, new Set(["host"]), 31_001)).toBeNull();
    expect(
      getRoomDeadline(reconcileRoom(state, new Set(), 1_801_000), new Set(), 1_801_001),
    ).toBeNull();
  });
});
