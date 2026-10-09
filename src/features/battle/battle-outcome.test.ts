import { describe, expect, it } from "vite-plus/test";

import { getRanking, getResultEntries, getResultHeadline, ordinal } from "./battle-outcome";
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

describe("結果の見出し", () => {
  it("勝者には勝ち、相手には負けを返す", () => {
    for (const reason of ["opponent-not-submitted", "higher-score"] as const) {
      const result = { kind: "win", reason, winnerId: "a", decidedAt: 0 } as const;
      expect(getResultHeadline(result, "a", "B")).toEqual({
        title: "YOU WIN!",
        message: "B さんに勝ちました！",
      });
      expect(getResultHeadline(result, "b", "A")).toEqual({
        title: "YOU LOSE…",
        message: "A さんの勝ちです。次こそは！",
      });
    }
  });

  it("同点は引き分けを返す", () => {
    expect(
      getResultHeadline({ kind: "draw", reason: "same-score", decidedAt: 0 }, "a", "B"),
    ).toEqual({ title: "DRAW", message: "最終スコアが同点でした" });
  });

  it("勝負不成立は理由ごとに説明を分ける", () => {
    expect(
      getResultHeadline({ kind: "no-contest", reason: "no-submissions", decidedAt: 0 }, "a", "B"),
    ).toEqual({ title: "NO GAME", message: "どちらも提出しなかったため、勝負不成立です" });
    expect(
      getResultHeadline({ kind: "no-contest", reason: "scoring-failed", decidedAt: 0 }, "a", "B"),
    ).toEqual({ title: "NO GAME", message: "採点できなかったため、勝負不成立です" });
  });
});

describe("参加者ごとの結果", () => {
  it("結果が確定していなければ返さない", () => {
    expect(getResultEntries(base, "a")).toEqual([]);
  });

  it("相手の未提出で勝ったら、自分の提出画像を表示し、相手を未提出にする", () => {
    const battle: BattleSnapshot = {
      ...base,
      result: { kind: "win", reason: "opponent-not-submitted", winnerId: "a", decidedAt: 75_000 },
    };
    expect(getResultEntries(battle, "a")).toEqual([
      {
        participantId: "a",
        winner: true,
        submitted: true,
        imageUrl: "https://example.invalid/a-2.png",
        total: null,
      },
      { participantId: "b", winner: false, submitted: false, imageUrl: null, total: null },
    ]);
  });

  it("スコアで決まったら、両者の提出画像と最終スコアを表示する", () => {
    const battle: BattleSnapshot = {
      ...base,
      scoringEndsAt: 320_000,
      scores: [
        { participantId: "a", total: 0.82, imageUrl: "https://example.invalid/a-2.png" },
        { participantId: "b", total: 0.64, imageUrl: "https://example.invalid/b-1.png" },
      ],
      result: { kind: "win", reason: "higher-score", winnerId: "a", decidedAt: 90_000 },
    };
    expect(getResultEntries(battle, "a")).toEqual([
      {
        participantId: "a",
        winner: true,
        submitted: true,
        imageUrl: "https://example.invalid/a-2.png",
        total: 0.82,
      },
      {
        participantId: "b",
        winner: false,
        submitted: true,
        imageUrl: "https://example.invalid/b-1.png",
        total: 0.64,
      },
    ]);
  });

  it("引き分けでは勝者を付けない", () => {
    const battle: BattleSnapshot = {
      ...base,
      scoringEndsAt: 320_000,
      scores: [
        { participantId: "a", total: 0.5, imageUrl: "https://example.invalid/a-2.png" },
        { participantId: "b", total: 0.5, imageUrl: "https://example.invalid/b-1.png" },
      ],
      result: { kind: "draw", reason: "same-score", decidedAt: 90_000 },
    };
    expect(getResultEntries(battle, "a").map((entry) => entry.winner)).toEqual([false, false]);
  });

  it("採点に失敗したら、両者を提出済みにし、相手の画像は表示しない", () => {
    const battle: BattleSnapshot = {
      ...base,
      scoringEndsAt: 320_000,
      result: { kind: "no-contest", reason: "scoring-failed", decidedAt: 320_000 },
    };
    expect(getResultEntries(battle, "a")).toEqual([
      {
        participantId: "a",
        winner: false,
        submitted: true,
        imageUrl: "https://example.invalid/a-2.png",
        total: null,
      },
      { participantId: "b", winner: false, submitted: true, imageUrl: null, total: null },
    ]);
  });

  it("両者が未提出なら、どちらも未提出にする", () => {
    const battle: BattleSnapshot = {
      ...base,
      mySubmission: { participantId: "a", status: "not-submitted", decidedAt: 75_000 },
      result: { kind: "no-contest", reason: "no-submissions", decidedAt: 75_000 },
    };
    expect(getResultEntries(battle, "a")).toEqual([
      { participantId: "a", winner: false, submitted: false, imageUrl: null, total: null },
      { participantId: "b", winner: false, submitted: false, imageUrl: null, total: null },
    ]);
  });
});

function score(participantId: string, total: number) {
  return { participantId, total, imageUrl: `https://example.invalid/${participantId}.png` };
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
