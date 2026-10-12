import { describe, expect, it } from "vite-plus/test";

import type { BattleSnapshot } from "./battle-state";
import {
  getInterimRanks,
  getRevealEndsAt,
  getRevealOrder,
  getRevealStage,
  revealTiming,
} from "./result-presentation";

const slot = revealTiming.introMs + revealTiming.judgingMs + revealTiming.scoreMs;
const decided = { kind: "draw", reason: "same-score", decidedAt: 100_000 } as const;
const score = (participantId: string, submittedAt: number, total = 50) => ({
  participantId,
  total,
  similarity: total,
  speedBonus: null,
  generationBonus: null,
  imageUrl: `/images/${participantId}.png`,
  submission: {
    participantId,
    status: "submitted" as const,
    generationId: `g-${participantId}`,
    submittedAt,
    successfulGenerationCount: 1,
    eligibleForSpeedBonus: true,
  },
});

describe("発表の順番", () => {
  it("提出時刻の早い順に並べ、同時刻は参加順にする", () => {
    const order = getRevealOrder({
      result: decided,
      participantIds: ["b", "a", "c"],
      scores: [score("c", 3_000), score("a", 5_000), score("b", 5_000)],
    });
    expect(order.map((entry) => entry.participantId)).toEqual(["c", "b", "a"]);
  });

  it("未提出・採点に失敗した人（`scores`にいない人）は含めない", () => {
    const order = getRevealOrder({
      result: decided,
      participantIds: ["a", "b", "c", "d"],
      scores: [score("d", 9_000), score("b", 1_000)],
    });
    expect(order.map((entry) => entry.participantId)).toEqual(["b", "d"]);
  });

  it("結果が未確定か、スコアのない結果では空にする", () => {
    const scores = [score("a", 1_000)];
    expect(getRevealOrder({ result: null, participantIds: ["a", "b"], scores })).toEqual([]);
    const solo: BattleSnapshot["result"] = {
      kind: "win",
      reason: "opponent-not-submitted",
      winnerId: "a",
      decidedAt: 0,
    };
    expect(getRevealOrder({ result: solo, participantIds: ["a", "b"], scores: null })).toEqual([]);
  });
});

const stage = (elapsed: number, count = 2) => getRevealStage(count, elapsed);

describe("発表の段階", () => {
  it("1人分を呼び出し・採点の様子・点数の順に進める", () => {
    expect(slot).toBe(8_000);
    expect(stage(-3_000)).toMatchObject({ kind: "reveal", index: 0, phase: "intro" });
    expect(stage(0)).toMatchObject({ index: 0, phase: "intro", progress: 0 });
    expect(stage(1_199)).toMatchObject({ index: 0, phase: "intro" });
    expect(stage(1_200)).toMatchObject({ index: 0, phase: "judging", step: 0, stepProgress: 0 });
    for (const step of [1, 2, 3, 4])
      expect(stage(1_200 + 800 * step)).toMatchObject({ phase: "judging", step });
    expect(stage(1_600)).toMatchObject({ step: 0, stepProgress: 0.5 });
    expect(stage(5_199)).toMatchObject({ index: 0, phase: "judging", step: 4 });
    expect(stage(5_200)).toMatchObject({ index: 0, phase: "score", step: 0 });
    expect(stage(7_999)).toMatchObject({ index: 0, phase: "score" });
    expect(stage(8_000)).toMatchObject({ index: 1, phase: "intro", progress: 0.5 });
  });

  it("全員の発表が終わったら最終の結果にする", () => {
    expect(stage(15_999)).toMatchObject({ kind: "reveal", index: 1, phase: "score" });
    expect(stage(16_000)).toEqual({ kind: "final" });
    expect(stage(Infinity)).toEqual({ kind: "final" });
    expect(getRevealStage(0, 0)).toEqual({ kind: "final" });
  });

  it("時間を変えても同じ規則で区切る", () => {
    const timing = { introMs: 100, judgingMs: 500, scoreMs: 400 };
    expect(getRevealStage(3, 2_550, timing)).toMatchObject({
      index: 2,
      phase: "judging",
      step: 4,
    });
    expect(getRevealStage(3, 3_000, timing)).toEqual({ kind: "final" });
  });

  it("発表の終了時刻は、結果の確定時刻に人数分の枠を足した時刻", () => {
    expect(getRevealEndsAt(4, 100_000)).toBe(100_000 + 4 * slot);
    expect(getRevealEndsAt(0, 100_000)).toBe(100_000);
  });
});

describe("途中の順位", () => {
  const order = [
    { participantId: "a", total: 90 },
    { participantId: "b", total: 80 },
    { participantId: "c", total: 90 },
  ];

  it("発表した人の中で順位を付け、同点は同じ順位にする", () => {
    expect(getInterimRanks(order, 2)).toEqual(
      new Map([
        ["a", 1],
        ["b", 2],
      ]),
    );
    expect(getInterimRanks(order, 3)).toEqual(
      new Map([
        ["a", 1],
        ["b", 3],
        ["c", 1],
      ]),
    );
    expect(getInterimRanks(order, 0)).toEqual(new Map());
  });
});
