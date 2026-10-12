import { describe, expect, it } from "vite-plus/test";

import {
  getInterimRanks,
  getRevealOrder,
  getRevealStage,
  revealTiming,
  type RevealEntry,
} from "./result-presentation";

function entry(participantId: string, submittedAt: number, total = 50): RevealEntry {
  return {
    participantId,
    similarity: total,
    speedBonus: null,
    generationBonus: null,
    total,
    imageUrl: `/generated-images/b/${participantId}`,
    submission: {
      participantId,
      status: "submitted",
      generationId: `g-${participantId}`,
      submittedAt,
      successfulGenerationCount: 1,
      eligibleForSpeedBonus: true,
    },
  };
}

describe("発表の順番", () => {
  it("提出時刻の早い順に並べ、同時刻は参加順にする", () => {
    const order = getRevealOrder({
      participantIds: ["b", "a", "c"],
      scores: [entry("c", 3_000), entry("a", 5_000), entry("b", 5_000)],
    });
    expect(order.map((item) => item.participantId)).toEqual(["c", "b", "a"]);
  });

  it("配信された`scores`にいない人（未提出・採点に失敗した人）は発表しない", () => {
    const order = getRevealOrder({
      participantIds: ["a", "b", "c", "d"],
      scores: [entry("d", 9_000), entry("b", 1_000)],
    });
    expect(order.map((item) => item.participantId)).toEqual(["b", "d"]);
  });

  it("`scores`のない結果（勝負不成立・1人だけの提出）では発表しない", () => {
    expect(getRevealOrder({ participantIds: ["a", "b"], scores: null })).toEqual([]);
  });
});

describe("発表の段階", () => {
  const slot = revealTiming.callMs + revealTiming.judgingMs + revealTiming.scoreMs;
  const judgingAt = revealTiming.callMs;
  const scoreAt = revealTiming.callMs + revealTiming.judgingMs;
  const stepMs = revealTiming.judgingMs / 5;

  it("1人分を名前の呼び出し・採点の様子・点数の順に進め、採点の様子は指標を1つずつ進める", () => {
    expect(slot).toBe(8_000);
    expect(getRevealStage(2, 0)).toMatchObject({ index: 0, phase: "call", phaseMs: 0 });
    expect(getRevealStage(2, judgingAt - 1)).toMatchObject({ index: 0, phase: "call" });
    expect(getRevealStage(2, judgingAt)).toMatchObject({
      phase: "judging",
      phaseMs: 0,
      step: 0,
      stepProgress: 0,
    });
    expect(getRevealStage(2, judgingAt + stepMs / 2)).toMatchObject({ step: 0, stepProgress: 0.5 });
    for (const step of [1, 2, 3, 4])
      expect(getRevealStage(2, judgingAt + stepMs * step)).toMatchObject({ step });
    expect(getRevealStage(2, scoreAt - 1)).toMatchObject({ phase: "judging", step: 4 });
    expect(getRevealStage(2, scoreAt + 100)).toMatchObject({
      index: 0,
      phase: "score",
      phaseMs: 100,
    });
    expect(getRevealStage(2, slot)).toMatchObject({ index: 1, phase: "call", progress: 0.5 });
  });

  it("結果が決まる前の経過は1人目の呼び出しにし、全員の発表が終わったら最終の結果にする", () => {
    expect(getRevealStage(2, -3_000)).toMatchObject({ index: 0, phase: "call", progress: 0 });
    expect(getRevealStage(2, slot * 2 - 1)).toMatchObject({ index: 1, phase: "score" });
    expect(getRevealStage(2, slot * 2)).toEqual({ kind: "final" });
    expect(getRevealStage(0, 0)).toEqual({ kind: "final" });
  });

  it("1人分の長さを変えても同じ規則で区切る", () => {
    const timing = { callMs: 100, judgingMs: 500, scoreMs: 400 };
    expect(getRevealStage(3, 2_550, timing)).toMatchObject({
      index: 2,
      phase: "judging",
      step: 4,
    });
    expect(getRevealStage(3, 3_000, timing)).toEqual({ kind: "final" });
  });
});

describe("途中の順位", () => {
  const order = [
    { participantId: "a", total: 80 },
    { participantId: "b", total: 90 },
    { participantId: "c", total: 90 },
  ];

  it("発表した人の中で点の高い順に順位を付け、同点は同じ順位にする", () => {
    expect(getInterimRanks(order, 0)).toEqual(new Map());
    expect(getInterimRanks(order, 1)).toEqual(new Map([["a", 1]]));
    expect(getInterimRanks(order, 2)).toEqual(
      new Map([
        ["a", 2],
        ["b", 1],
      ]),
    );
    expect(getInterimRanks(order, 3)).toEqual(
      new Map([
        ["a", 3],
        ["b", 1],
        ["c", 1],
      ]),
    );
  });
});
