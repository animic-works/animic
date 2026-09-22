import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { createBattle, battleStateSchema } from "./battle-state";
import type { BattleSettings, Topic } from "./battle-state";

const settings: BattleSettings = { difficulty: "easy", durationSeconds: 120, selectionSeconds: 60 };
const topic: Topic = {
  id: "test",
  difficulty: "easy",
  imageUrl: "https://example.invalid/topic.png",
};

describe("対戦の開始", () => {
  it("参加者と条件を記録し、サーバー時刻から締切を計算する", () => {
    const battle = createBattle(settings, topic, ["a", "b"], 10_000);
    expect(battle.startedAt).toBe(10_000);
    expect(battle.generationEndsAt).toBe(130_000);
    expect(battle.participantIds).toEqual(["a", "b"]);
  });
  it("開始後のルーム設定や参加者変更を対戦へ反映しない", () => {
    const nextSettings = { ...settings };
    const nextTopic = { ...topic };
    const participants = ["a", "b"];
    const battle = createBattle(nextSettings, nextTopic, participants, 10_000);
    nextSettings.durationSeconds = 300;
    nextTopic.imageUrl = "https://example.invalid/changed.png";
    participants.push("c");
    expect(battle.settings.durationSeconds).toBe(120);
    expect(battle.generationEndsAt).toBe(130_000);
    expect(battle.topic.imageUrl).toBe(topic.imageUrl);
    expect(battle.participantIds).toEqual(["a", "b"]);
  });
  it("選んだ難易度と異なるお題では開始しない", () => {
    expect(() => createBattle(settings, { ...topic, difficulty: "hard" }, ["a", "b"], 0)).toThrow();
  });
  it("開始は1対1に限定し、保存スキーマには人数を固定しない", () => {
    expect(() => createBattle(settings, topic, ["a", "b", "c"], 0)).toThrow();
    const battle = createBattle(settings, topic, ["a", "b"], 0);
    expect(
      v.parse(battleStateSchema, { ...battle, participantIds: ["a", "b", "c", "d"] })
        .participantIds,
    ).toHaveLength(4);
    expect(() => createBattle(settings, topic, ["a"], 0)).toThrow();
    expect(() => createBattle(settings, topic, ["a", "a"], 0)).toThrow();
  });
});
