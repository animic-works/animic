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

/**
 * 手元の残り時間（`getBattleDeadline`の期限まで）が0になってから、サーバーの締切の配信が届くまで止める操作。
 * 生成の期限を過ぎたら生成を、画像選択の猶予を過ぎたら提出を止める。生成の期限の後も猶予の間は提出できるため、
 * 生成中の段階では提出を止めない。表示上止めるだけで、受け付けるかどうかはサーバーが決める。
 */
export function getExpiredActions(stage: BattleStage, remaining: number | null) {
  const expired = remaining === 0;
  return {
    generation: expired && stage === "generating",
    submission: expired && stage === "selecting",
  };
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

/**
 * 提出した後の待機中に、ほかの人が使える残り時間を返す。生成の残りを数え、生成が終わっていれば画像選択の猶予を数える。
 * 全員の提出がそろったら、残り時間は出さない（`null`）。
 */
export function getWaitingClock(
  battle: BattleTiming & Pick<BattleSnapshot, "submissionsClosed">,
  generationRemaining: number | null,
  selectionRemaining: number | null,
) {
  if (battle.submissionsClosed) return null;
  if (generationRemaining !== null && generationRemaining > 0)
    return {
      stage: "generating",
      clock: getBattleClock(battle, "generating", generationRemaining),
    } as const;
  if (selectionRemaining !== null && selectionRemaining > 0)
    return {
      stage: "selecting",
      clock: getBattleClock(battle, "selecting", selectionRemaining),
    } as const;
  return null;
}

/** 採点期限（`scoringEndsAt`）までの残りから、採点の開始から時間がかかっているかを返す。 */
export function isScoringSlow(remaining: number | null) {
  return remaining !== null && remaining <= scoringTimeoutMs - slowScoringMs;
}
