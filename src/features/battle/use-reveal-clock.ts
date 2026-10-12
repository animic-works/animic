import { useEffect, useState } from "react";
import { useMonotonicNow } from "./use-remaining-ms";

/**
 * 結果の確定からの経過時間。配信時のサーバー時刻と受信後の経過（単調増加時計）から求め、端末の時計を使わない。
 * 全員の画面で同じ値になる。
 */
export function useRevealElapsed(serverTime: number, receivedAt: number | null, decidedAt: number) {
  const now = useMonotonicNow();
  return (
    serverTime -
    decidedAt +
    (now === null || receivedAt === null ? 0 : Math.max(0, now - receivedAt))
  );
}

/**
 * 描画を始めてからの経過（ms）を、`startMs`から数える。点数の数え上げのように、
 * 時計の刻み（200ms）より細かく動かす演出に使う。`untilMs`に達したら数えるのをやめる。
 */
export function useAnimationElapsed(startMs: number, untilMs: number) {
  const [elapsed, setElapsed] = useState(startMs);
  useEffect(() => {
    if (startMs >= untilMs) return undefined;
    let frame = 0;
    const origin = performance.now();
    const step = (time: number) => {
      const next = startMs + (time - origin);
      setElapsed(next);
      if (next < untilMs) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [startMs, untilMs]);
  return elapsed;
}
