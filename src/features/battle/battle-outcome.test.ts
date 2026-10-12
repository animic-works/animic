import { describe, expect, it } from "vite-plus/test";

import { getRanking, ordinal } from "./battle-outcome";
import type { BattleSnapshot } from "./battle-state";

const base: BattleSnapshot = {
  serverTime: 200_000,
  id: "battle-1",
  previousBattleId: null,
  topic: { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
  settings: { difficulty: "easy", durationSeconds: 60, selectionSeconds: 15 },
  participantIds: ["b", "a"],
  startedAt: 0,
  generationEndsAt: 60_000,
  selectionEndsAt: 75_000,
  scoringEndsAt: null,
  scores: null,
  result: null,
  submissionsClosed: true,
  generationClosed: true,
  myGenerations: [
    {
      id: "g1",
      acceptedAt: 1_000,
      status: "succeeded",
      finishedAt: 7_000,
      imageUrl: "https://example.invalid/a-1.png",
    },
    {
      id: "g2",
      acceptedAt: 8_000,
      status: "succeeded",
      finishedAt: 14_000,
      imageUrl: "https://example.invalid/a-2.png",
    },
  ],
  mySubmission: {
    participantId: "a",
    status: "submitted",
    generationId: "g2",
    submittedAt: 20_000,
    successfulGenerationCount: 2,
    eligibleForSpeedBonus: true,
  },
};

describe("1対1の順位", () => {
  it("結果が確定していなければ返さない", () => {
    expect(getRanking(base, "a")).toEqual([]);
  });

  it("相手の未提出で勝ったら、自分を1位にして提出画像を出し、相手は順位なしにする", () => {
    const battle: BattleSnapshot = {
      ...base,
      result: { kind: "win", reason: "opponent-not-submitted", winnerId: "a", decidedAt: 75_000 },
    };
    expect(getRanking(battle, "a")).toEqual([
      { participantId: "a", rank: 1, imageUrl: "https://example.invalid/a-2.png", total: null },
      { participantId: "b", rank: null, imageUrl: null, total: null },
    ]);
  });

  it("スコアで決まったら、両者の提出画像と最終スコアを高い順に出す", () => {
    const battle: BattleSnapshot = {
      ...base,
      scoringEndsAt: 320_000,
      scores: [
        score("a", 0.64, "https://example.invalid/a-2.png"),
        score("b", 0.82, "https://example.invalid/b-1.png"),
      ],
      result: { kind: "win", reason: "higher-score", winnerId: "b", decidedAt: 90_000 },
    };
    expect(getRanking(battle, "a")).toEqual([
      { participantId: "b", rank: 1, imageUrl: "https://example.invalid/b-1.png", total: 0.82 },
      { participantId: "a", rank: 2, imageUrl: "https://example.invalid/a-2.png", total: 0.64 },
    ]);
  });

  it("引き分けでは両者を同じ1位にする", () => {
    const battle: BattleSnapshot = {
      ...base,
      scoringEndsAt: 320_000,
      scores: [score("a", 0.5), score("b", 0.5)],
      result: { kind: "draw", reason: "same-score", decidedAt: 90_000 },
    };
    expect(getRanking(battle, "a").map((entry) => entry.rank)).toEqual([1, 1]);
  });

  it("採点に失敗したら、両者を順位なしにし、相手の画像は出さない", () => {
    const battle: BattleSnapshot = {
      ...base,
      scoringEndsAt: 320_000,
      result: { kind: "no-contest", reason: "scoring-failed", decidedAt: 320_000 },
    };
    expect(getRanking(battle, "a")).toEqual([
      { participantId: "b", rank: null, imageUrl: null, total: null },
      { participantId: "a", rank: null, imageUrl: "https://example.invalid/a-2.png", total: null },
    ]);
  });

  it("両者が未提出なら、どちらも順位なしにし、画像を出さない", () => {
    const battle: BattleSnapshot = {
      ...base,
      mySubmission: { participantId: "a", status: "not-submitted", decidedAt: 75_000 },
      result: { kind: "no-contest", reason: "no-submissions", decidedAt: 75_000 },
    };
    expect(getRanking(battle, "a")).toEqual([
      { participantId: "b", rank: null, imageUrl: null, total: null },
      { participantId: "a", rank: null, imageUrl: null, total: null },
    ]);
  });
});

function score(
  participantId: string,
  total: number,
  imageUrl = `https://example.invalid/${participantId}.png`,
) {
  return {
    participantId,
    similarity: total,
    speedBonus: null,
    generationBonus: null,
    total,
    imageUrl,
    submission: {
      participantId,
      status: "submitted" as const,
      generationId: `${participantId}-1`,
      submittedAt: 10_000,
      successfulGenerationCount: 1,
      eligibleForSpeedBonus: true,
    },
  };
}

describe("3人以上の順位", () => {
  const trio: BattleSnapshot = { ...base, participantIds: ["b", "a", "c", "d"] };
  it("最終スコアの高い順に並べ、同点は同じ順位、順位のない人は最後にする", () => {
    const ranking = getRanking(
      {
        ...trio,
        result: { kind: "draw", reason: "same-score", decidedAt: 90_000 },
        scores: [score("a", 80), score("b", 90), score("c", 90)],
      },
      "a",
    );
    expect(ranking.map((item) => [item.participantId, item.rank, item.total])).toEqual([
      ["b", 1, 90],
      ["c", 1, 90],
      ["a", 3, 80],
      ["d", null, null],
    ]);
  });
  it("1人だけ提出したら、採点を待たずにその人を1位にする", () => {
    const ranking = getRanking(
      {
        ...trio,
        result: {
          kind: "win",
          reason: "opponent-not-submitted",
          winnerId: "a",
          decidedAt: 75_000,
        },
      },
      "a",
    );
    expect(ranking[0]).toEqual({
      participantId: "a",
      rank: 1,
      imageUrl: "https://example.invalid/a-2.png",
      total: null,
    });
    expect(ranking.slice(1).every((item) => item.rank === null)).toBe(true);
  });
  it("順位を英語の序数で表す", () => {
    expect([1, 2, 3, 4, 11].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th"]);
  });
});
