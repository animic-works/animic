import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  acceptGeneration,
  createBattle,
  finishGeneration,
  reconcileBattle,
  submitImage,
} from "../battle/battle-state";
import type { BattleState, ScoringJobOutcome } from "../battle/battle-state";
import {
  applyRoomScoring,
  canJoinRoom,
  getIdleDeadline,
  reconcileRoom,
  getRoomDeadline,
  roomCapacity,
  roomStateSchema,
} from "./room-state";
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
      { id: "host", name: "ホスト", ready: false, icon: null },
      { id: "first", name: "先に参加", ready: true, icon: null },
      { id: "second", name: "後に参加", ready: false, icon: null },
    ],
    hostDisconnectedUntil: null,
    closesAt: null,
    closed: false,
  };
}

describe("ルームの接続と期限", () => {
  it("2戦制限があった時の保存状態も、ルームと対戦を維持して読み込める", () => {
    const state = {
      ...room(),
      battle: createBattle(
        { difficulty: "easy", durationSeconds: 60, selectionSeconds: 10 },
        { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
        ["host", "first"],
        0,
      ),
    };
    expect(v.parse(roomStateSchema, { ...state, battleCount: 2 })).toEqual(state);
  });
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
  it("全接続がなくなってから3分で閉じ、遅れた再接続でも復活しない", () => {
    const empty = reconcileRoom(room(), new Set(), 1000);
    expect(empty.closesAt).toBe(181_000);
    expect(reconcileRoom(empty, new Set(["host"]), 181_000).closed).toBe(true);
    const closed = reconcileRoom(empty, new Set(), 181_000);
    expect(reconcileRoom(closed, new Set(["host"]), 182_000).closed).toBe(true);
  });
  it("誰かが戻った後に全員切断した場合は新しい3分を数える", () => {
    const empty = reconcileRoom(room(), new Set(), 1000);
    const returned = reconcileRoom(empty, new Set(["host"]), 10_000);
    expect(returned.closesAt).toBeNull();
    expect(reconcileRoom(returned, new Set(), 20_000).closesAt).toBe(200_000);
    expect(returned.members[1]?.ready).toBe(true);
  });
  it("閉じた時点で結果の出ていない対戦は、閉じた時刻で勝負不成立にする", () => {
    const battle = createBattle(
      { difficulty: "easy", durationSeconds: 600, selectionSeconds: 60 },
      { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
      ["host", "first"],
      0,
    );
    const empty = reconcileRoom({ ...room(), battle }, new Set(), 1000);
    expect(empty.battle?.result).toBeNull();
    const closed = reconcileRoom(empty, new Set(), 181_000);
    expect(closed.closed).toBe(true);
    expect(closed.battle?.result).toEqual({
      kind: "no-contest",
      reason: "room-closed",
      decidedAt: 181_000,
    });
    expect(reconcileRoom(closed, new Set(), 200_000).battle).toEqual(closed.battle);
  });
});

describe("ルームの次の期限", () => {
  it("状態確認直後に閉鎖期限を跨いでも、即時実行を予約する", () => {
    const state = reconcileRoom(room(), new Set(), 1000);
    expect(getRoomDeadline(state, new Set(), 181_000)).toBe(181_000);
    expect(getRoomDeadline(state, new Set(), 181_001)).toBe(181_001);
    expect(reconcileRoom(state, new Set(), 181_001).closed).toBe(true);
  });
  it("引き継ぎ先がいるときは、跨いだホスト期限も処理する", () => {
    const connected = new Set(["first"]);
    const state = reconcileRoom(room(), connected, 1000);
    expect(getRoomDeadline(state, connected, 31_001)).toBe(31_001);
    expect(reconcileRoom(state, connected, 31_001).hostId).toBe("first");
  });
  it("引き継ぎ先がない期限で即時予約を繰り返さず、閉鎖期限を残す", () => {
    const state = reconcileRoom(room(), new Set(), 1000);
    expect(getRoomDeadline(state, new Set(), 31_001)).toBe(181_000);
  });
  it("復帰や閉鎖で不要になった期限を予約しない", () => {
    const state = reconcileRoom(room(), new Set(), 1000);
    const returned = reconcileRoom(state, new Set(["host"]), 10_000);
    expect(getRoomDeadline(returned, new Set(["host"]), 31_001)).toBeNull();
    expect(
      getRoomDeadline(reconcileRoom(state, new Set(), 181_000), new Set(), 181_001),
    ).toBeNull();
  });
});

function members(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `m${index}`,
    name: `参加者${index}`,
    ready: false,
    icon: null,
  }));
}

describe("ルームの定員", () => {
  it("定員までは新しい人を受け付け、定員に達したら受け付けない", () => {
    expect(canJoinRoom({ members: members(roomCapacity - 1) }, "new")).toBe(true);
    expect(canJoinRoom({ members: members(roomCapacity) }, "new")).toBe(false);
  });
  it("参加済みの人の再参加は定員に達していても受け付ける", () => {
    expect(canJoinRoom({ members: members(roomCapacity) }, "m0")).toBe(true);
  });
});

// 2人とも提出して採点を待つ対戦（全員の提出は4000で確定し、採点期限は304_000）。
function scoringRoom(): RoomState {
  let battle = createBattle(
    { difficulty: "easy", durationSeconds: 600, selectionSeconds: 60 },
    { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
    ["host", "first"],
    0,
  );
  for (const id of ["host", "first"]) {
    battle = acceptGeneration(battle, { id, participantId: id, inputHash: id }, 1000).battle;
    battle = finishGeneration(
      battle,
      id,
      { status: "succeeded", imageUrl: `https://example.invalid/${id}.png` },
      2000,
    );
  }
  battle = submitImage(submitImage(battle, "host", "host", 3000), "first", "first", 4000);
  return { ...room(), battle };
}
function scored(battle: BattleState | null): ScoringJobOutcome[] {
  return (battle?.scoring.entries ?? []).map((entry) => ({
    id: entry.jobId,
    state: "succeeded",
    totals: [
      { participantId: entry.participantId, total: entry.participantId === "host" ? 80 : 60 },
    ],
  }));
}
describe("採点結果の反映", () => {
  const everyone = new Set(["host", "first"]);
  it("期限内に届いた採点で勝敗を決める", () => {
    const state = scoringRoom();
    expect(
      applyRoomScoring(state, everyone, state.battle?.id ?? "", scored(state.battle), 5000)?.battle
        ?.result,
    ).toEqual({ kind: "win", reason: "higher-score", winnerId: "host", decidedAt: 5000 });
  });
  it("ルームを閉じる時刻の後に届いた採点は反映せず、閉じた時刻の勝負不成立にする", () => {
    const state = { ...scoringRoom(), closesAt: 100_000 };
    const id = state.battle?.id ?? "";
    expect(applyRoomScoring(state, new Set(), id, scored(state.battle), 99_999)).not.toBeNull();
    expect(applyRoomScoring(state, new Set(), id, scored(state.battle), 100_000)).toBeNull();
    expect(reconcileRoom(state, new Set(), 100_000).battle?.result).toEqual({
      kind: "no-contest",
      reason: "room-closed",
      decidedAt: 100_000,
    });
  });
  it("採点期限の後に届いた採点は反映しない", () => {
    const state = scoringRoom();
    const id = state.battle?.id ?? "";
    expect(applyRoomScoring(state, everyone, id, scored(state.battle), 304_000)).toBeNull();
    expect(state.battle && reconcileBattle(state.battle, 304_000).result).toEqual({
      kind: "no-contest",
      reason: "scoring-failed",
      decidedAt: 304_000,
    });
  });
  it("別の対戦や、結果の決まった対戦には反映しない", () => {
    const state = scoringRoom();
    const id = state.battle?.id ?? "";
    expect(applyRoomScoring(state, everyone, "other", scored(state.battle), 5000)).toBeNull();
    const decided = applyRoomScoring(state, everyone, id, scored(state.battle), 5000);
    expect(decided && applyRoomScoring(decided, everyone, id, [], 6000)).toBeNull();
  });
});

describe("操作のない接続を切る時刻", () => {
  const battle = createBattle(
    { difficulty: "easy", durationSeconds: 60, selectionSeconds: 10 },
    { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
    ["host", "first"],
    0,
  );
  const finished = {
    ...battle,
    result: { kind: "no-contest" as const, reason: "no-submissions" as const, decidedAt: 70_000 },
  };
  it("対戦の前と対戦中は切らない", () => {
    expect(getIdleDeadline(null, 1000)).toBeNull();
    expect(getIdleDeadline(battle, 1000)).toBeNull();
  });
  it("結果が決まった時刻と最後の操作の遅い方から5分後に切る", () => {
    expect(getIdleDeadline(finished, 1000)).toBe(370_000);
    expect(getIdleDeadline(finished, 100_000)).toBe(400_000);
  });
});
