import { describe, expect, it } from "vite-plus/test";
import { getBattleClock, getBattleDeadline } from "./battle-clock";

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
