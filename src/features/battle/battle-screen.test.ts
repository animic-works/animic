import { describe, expect, it } from "vite-plus/test";

import { getBattleScreen } from "./battle-screen";
import type { BattleSnapshot } from "./battle-state";

const base: BattleSnapshot = {
  serverTime: 10_000,
  id: "battle-1",
  previousBattleId: null,
  topic: { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
  settings: { difficulty: "easy", durationSeconds: 60, selectionSeconds: 15 },
  participantIds: ["a", "b"],
  startedAt: 0,
  generationEndsAt: 60_000,
  selectionEndsAt: null,
  scoringEndsAt: null,
  scores: null,
  result: null,
  submissionsClosed: false,
  generationClosed: false,
  myGenerations: [],
  mySubmission: null,
};

describe("表示する画面", () => {
  it("対戦がなければ、最初の対戦のロビーを表示する", () => {
    expect(getBattleScreen(null, "a", null)).toEqual({
      kind: "lobby",
      previousBattleId: null,
      waitingForNext: false,
    });
  });

  it("生成の受付中・完成待ち・画像の選択を区別する", () => {
    expect(getBattleScreen(base, "a", null)).toMatchObject({ kind: "battle", stage: "generating" });
    const closed = { ...base, serverTime: 61_000, generationClosed: true };
    expect(getBattleScreen(closed, "a", null)).toMatchObject({
      kind: "battle",
      stage: "finishing",
    });
    expect(getBattleScreen({ ...closed, selectionEndsAt: 75_000 }, "a", null)).toMatchObject({
      kind: "battle",
      stage: "selecting",
    });
  });

  it("自分の提出状態が確定したら、結果まで待機し、採点が始まったら採点中を表示する", () => {
    const submitted: BattleSnapshot = {
      ...base,
      mySubmission: {
        participantId: "a",
        status: "submitted",
        generationId: "g",
        submittedAt: 5_000,
        successfulGenerationCount: 1,
        eligibleForSpeedBonus: true,
      },
    };
    expect(getBattleScreen(submitted, "a", null)).toMatchObject({
      kind: "battle",
      stage: "waiting",
    });
    expect(getBattleScreen({ ...submitted, scoringEndsAt: 400_000 }, "a", null)).toMatchObject({
      kind: "battle",
      stage: "scoring",
    });
  });

  it("対戦に含まれていない参加者には、次の対戦を待つロビーを表示する", () => {
    expect(getBattleScreen(base, "c", null)).toEqual({
      kind: "lobby",
      previousBattleId: "battle-1",
      waitingForNext: true,
    });
  });

  it("結果は閉じるまで表示し、閉じたら次の対戦のロビーに戻す", () => {
    const decided: BattleSnapshot = {
      ...base,
      result: { kind: "no-contest", reason: "no-submissions", decidedAt: 80_000 },
    };
    expect(getBattleScreen(decided, "a", null)).toMatchObject({ kind: "result" });
    expect(getBattleScreen(decided, "a", "battle-1")).toEqual({
      kind: "lobby",
      previousBattleId: "battle-1",
      waitingForNext: false,
    });
    expect(getBattleScreen(decided, "a", "older-battle")).toMatchObject({ kind: "result" });
  });

  it("結果の確定後に途中参加した人には、結果ではなくロビーを表示する", () => {
    const decided: BattleSnapshot = {
      ...base,
      result: { kind: "no-contest", reason: "no-submissions", decidedAt: 80_000 },
    };
    expect(getBattleScreen(decided, "c", null)).toEqual({
      kind: "lobby",
      previousBattleId: "battle-1",
      waitingForNext: false,
    });
  });
});
