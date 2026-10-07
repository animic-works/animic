import type { BattleSnapshot } from "./battle-state";

export type BattleStage = "generating" | "finishing" | "selecting" | "waiting" | "scoring";

export type BattleScreen =
  | { kind: "lobby"; previousBattleId: string | null; waitingForNext: boolean }
  | { kind: "battle"; battle: BattleSnapshot; stage: BattleStage }
  | { kind: "result"; battle: BattleSnapshot };

/**
 * ルームの対戦状態から、同じルームURLで表示する画面を決める。
 * 結果を閉じた対戦（`dismissedBattleId`）はロビーに戻し、次の対戦の開始に使う。
 */
export function getBattleScreen(
  battle: BattleSnapshot | null,
  participantId: string,
  dismissedBattleId: string | null,
): BattleScreen {
  if (!battle) return { kind: "lobby", previousBattleId: null, waitingForNext: false };
  const joined = battle.participantIds.includes(participantId);
  if (battle.result) {
    return joined && dismissedBattleId !== battle.id
      ? { kind: "result", battle }
      : { kind: "lobby", previousBattleId: battle.id, waitingForNext: false };
  }
  if (!joined) return { kind: "lobby", previousBattleId: battle.id, waitingForNext: true };
  if (battle.mySubmission) {
    return { kind: "battle", battle, stage: battle.scoringEndsAt === null ? "waiting" : "scoring" };
  }
  if (!battle.generationClosed) return { kind: "battle", battle, stage: "generating" };
  if (battle.selectionEndsAt === null) return { kind: "battle", battle, stage: "finishing" };
  return { kind: "battle", battle, stage: "selecting" };
}
