import { scoringTimeoutMs, type BattleSnapshot } from "./battle-state";
import type { BattleStage } from "./battle-screen";

const urgentMs = 10_000;
/** 採点の開始からこの時間を過ぎたら、時間がかかっていることを伝える。 */
const slowScoringMs = 30_000;
type BattleTiming = Pick<BattleSnapshot, "generationEndsAt" | "selectionEndsAt" | "settings">;

/** 段階に応じて、残り時間を数える期限を返す。生成中と画像選択の猶予の間だけ数える。 */
export function getBattleDeadline(battle: BattleTiming, stage: BattleStage) {
  if (stage === "generating") return battle.generationEndsAt;
  if (stage === "selecting") return battle.selectionEndsAt;
  return null;
}

/** 残り時間を、表示する秒・急ぎの状態・色・残りの割合にする。 */
export function getBattleClock(battle: BattleTiming, stage: BattleStage, remaining: number | null) {
  const totalMs =
    (stage === "generating" ? battle.settings.durationSeconds : battle.settings.selectionSeconds) *
    1000;
  const seconds = Math.ceil((remaining ?? 0) / 1000);
  const urgent = stage === "generating" && remaining !== null && remaining <= urgentMs;
  return {
    seconds,
    label: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    urgent,
    tone: stage === "selecting" ? "highlight" : urgent ? "primary" : "neutral",
    percent: remaining === null ? 0 : (remaining / totalMs) * 100,
  } as const;
}

/** 採点期限（`scoringEndsAt`）までの残りから、採点の開始から時間がかかっているかを返す。 */
export function isScoringSlow(remaining: number | null) {
  return remaining !== null && remaining <= scoringTimeoutMs - slowScoringMs;
}
