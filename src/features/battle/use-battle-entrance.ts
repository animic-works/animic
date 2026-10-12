import { useEffect, useState } from "react";
import { usePageTransition } from "../navigation/page-transition-provider";
import { useReducedMotion } from "./battle-preferences";

export function useBattleEntrance(entering: boolean) {
  const { transitioning } = usePageTransition();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"waiting" | "kickoff" | "revealing" | "complete">(
    entering ? "waiting" : "complete",
  );
  // 動きを減らす設定で終えた演出は、設定を戻しても再生しない。
  if (reduced && phase !== "complete") setPhase("complete");
  const complete = phase === "complete" || reduced;
  useEffect(() => {
    if (complete || !entering || transitioning) return undefined;
    const timers = [
      setTimeout(() => setPhase("kickoff"), 900),
      setTimeout(() => setPhase("revealing"), 2000),
      setTimeout(() => setPhase("complete"), 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [entering, transitioning, complete]);
  return complete ? "complete" : phase;
}
