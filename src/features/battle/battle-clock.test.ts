import { describe, expect, it } from "vite-plus/test";
import {
  getBattleClock,
  getBattleDeadline,
  getExpiredActions,
  getWaitingClock,
  isScoringSlow,
} from "./battle-clock";

const battle = {
  generationEndsAt: 60_000,
  selectionEndsAt: 75_000,
  settings: { difficulty: "easy" as const, durationSeconds: 60, selectionSeconds: 15 },
};

describe("残り時間の表示", () => {
  it("生成中と画像選択の猶予の間だけ期限を数える", () => {
    expect(getBattleDeadline(battle, "generating")).toBe(60_000);
    expect(getBattleDeadline(battle, "selecting")).toBe(75_000);
    expect(getBattleDeadline(battle, "waiting")).toBeNull();
  });
  it("生成中の残り10秒以下を急ぎにし、秒と割合を求める", () => {
    expect(getBattleClock(battle, "generating", 30_000)).toMatchObject({
      seconds: 30,
      label: "0:30",
      urgent: false,
      tone: "neutral",
      percent: 50,
    });
    expect(getBattleClock(battle, "generating", 9_500)).toMatchObject({
      urgent: true,
      tone: "primary",
    });
    expect(getBattleClock(battle, "selecting", 3_000)).toMatchObject({
      urgent: false,
      tone: "highlight",
      percent: 20,
    });
  });
});

describe("提出した後の待機中の残り時間", () => {
  const open = { ...battle, submissionsClosed: false };
  it("生成の残りを数え、生成が終わったら画像選択の猶予を数える", () => {
    expect(getWaitingClock(open, 30_000, 45_000)).toMatchObject({
      stage: "generating",
      clock: { label: "0:30" },
    });
    expect(getWaitingClock(open, 0, 12_000)).toMatchObject({
      stage: "selecting",
      clock: { label: "0:12" },
    });
  });
  it("画像選択の猶予が決まっていない間・終わった後・全員の提出がそろった後は出さない", () => {
    expect(getWaitingClock(open, 0, null)).toBeNull();
    expect(getWaitingClock(open, 0, 0)).toBeNull();
    expect(getWaitingClock({ ...battle, submissionsClosed: true }, 30_000, 45_000)).toBeNull();
  });
});

describe("採点の待ち時間", () => {
  it("採点の開始（期限の5分前）から30秒を過ぎたら、時間がかかっているとする", () => {
    expect(isScoringSlow(null)).toBe(false);
    expect(isScoringSlow(5 * 60_000)).toBe(false);
    expect(isScoringSlow(4 * 60_000 + 30_001)).toBe(false);
    expect(isScoringSlow(4 * 60_000 + 30_000)).toBe(true);
    expect(isScoringSlow(0)).toBe(true);
  });
});

describe("手元の残り時間が0になった後の操作", () => {
  it("生成の期限を過ぎたら、締切の配信を待たずに生成を止める。提出は猶予の間できるため止めない", () => {
    expect(getExpiredActions("generating", 0)).toEqual({ generation: true, submission: false });
    expect(getExpiredActions("generating", 1)).toEqual({ generation: false, submission: false });
  });
  it("画像選択の猶予を過ぎたら提出を止める", () => {
    expect(getExpiredActions("selecting", 0)).toEqual({ generation: false, submission: true });
    expect(getExpiredActions("selecting", 500)).toEqual({ generation: false, submission: false });
  });
  it("期限を数えない段階では止めない", () => {
    for (const stage of ["finishing", "waiting", "scoring"] as const)
      expect(getExpiredActions(stage, null)).toEqual({ generation: false, submission: false });
  });
});
