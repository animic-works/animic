import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";

import { computeFinalScores, scoreBonusSchema } from "./final-score";
import type { ScoredSubmission } from "./final-score";

const bonus = { speedPoints: 3, generationPoints: 3, minSimilarity: 0 };

function parsesBonus(value: object) {
  return v.safeParse(scoreBonusSchema, { ...bonus, ...value }).success;
}

function scored(
  participantId: string,
  similarity: number,
  submittedAt: number,
  generationCount: number,
  withinTimeLimit = true,
): ScoredSubmission {
  return { participantId, similarity, submittedAt, withinTimeLimit, generationCount };
}

describe("最終スコア", () => {
  it("いちばん早く提出した人と、いちばん少ない生成回数の人にボーナスを加える", () => {
    expect(computeFinalScores([scored("a", 70, 3000, 4), scored("b", 80, 5000, 2)], bonus)).toEqual(
      [
        { participantId: "a", similarity: 70, speedBonus: 3, generationBonus: 0, total: 73 },
        { participantId: "b", similarity: 80, speedBonus: 0, generationBonus: 3, total: 83 },
      ],
    );
  });
  it("同じ時刻・同じ回数の人が複数いれば、ボーナスを人数で等分する", () => {
    const scores = computeFinalScores(
      [scored("a", 70, 3000, 2), scored("b", 60, 3000, 2), scored("c", 50, 4000, 2)],
      bonus,
    );
    expect(scores.map(({ speedBonus, generationBonus }) => [speedBonus, generationBonus])).toEqual([
      [1.5, 1],
      [1.5, 1],
      [0, 1],
    ]);
    expect(scores.map((score) => score.total)).toEqual([72.5, 62.5, 51]);
  });
  it("分けた点は小数3桁に丸める", () => {
    const scores = computeFinalScores(
      ["a", "b", "c"].map((id) => scored(id, 70.123, 3000, 1)),
      { speedPoints: 2, generationPoints: 0, minSimilarity: 0 },
    );
    expect(scores[0]).toMatchObject({ speedBonus: 0.667, total: 70.79 });
  });
  it("時間切れの後・自動の提出は最速提出ボーナスの対象にせず、最少生成ボーナスの対象にする", () => {
    expect(
      computeFinalScores([scored("a", 70, 3000, 3), scored("b", 70, 2000, 1, false)], bonus),
    ).toEqual([
      { participantId: "a", similarity: 70, speedBonus: 3, generationBonus: 0, total: 73 },
      { participantId: "b", similarity: 70, speedBonus: 0, generationBonus: 3, total: 73 },
    ]);
  });
  it("制限時間内の提出がなければ、最速提出ボーナスは誰にも加えない", () => {
    const scores = computeFinalScores(
      [scored("a", 70, 3000, 3, false), scored("b", 70, 2000, 1, false)],
      bonus,
    );
    expect(scores.map((score) => score.speedBonus)).toEqual([0, 0]);
  });
  it("再現度が下限より低い人はボーナスの対象にせず、下限ちょうどの人は対象にする", () => {
    const scores = computeFinalScores(
      [scored("a", 39.9, 1000, 1), scored("b", 40, 2000, 2), scored("c", 90, 3000, 3)],
      { ...bonus, minSimilarity: 40 },
    );
    expect(scores.map(({ speedBonus, generationBonus }) => [speedBonus, generationBonus])).toEqual([
      [0, 0],
      [3, 3],
      [0, 0],
    ]);
  });
  it("点が0のボーナスは定義しないものとして扱い、内訳を`null`にする", () => {
    expect(
      computeFinalScores([scored("a", 70, 3000, 1)], {
        speedPoints: 0,
        generationPoints: 2,
        minSimilarity: 0,
      }),
    ).toEqual([
      { participantId: "a", similarity: 70, speedBonus: null, generationBonus: 2, total: 72 },
    ]);
  });
  it("ボーナスは0〜20点、下限は0〜100点の整数だけを受け付ける", () => {
    expect(parsesBonus({ speedPoints: 0, generationPoints: 20, minSimilarity: 100 })).toBe(true);
    expect(parsesBonus({ speedPoints: 21 })).toBe(false);
    expect(parsesBonus({ generationPoints: -1 })).toBe(false);
    expect(parsesBonus({ speedPoints: 1.5 })).toBe(false);
    expect(parsesBonus({ minSimilarity: 101 })).toBe(false);
  });
});
