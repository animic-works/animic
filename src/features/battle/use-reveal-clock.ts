import { useEffect, useState } from "react";
import { useMonotonicNow } from "./use-remaining-ms";

type RevealControl =
  | { skipped: false; rate: 1 | 3; anchorBase: number; anchorVirtual: number }
  | { skipped: true };

/**
 * 結果の確定からの経過時間。配信時のサーバー時刻と受信後の経過（単調増加時計）から求め、端末の時計を使わない。
 * 全員の画面で同じ値になる。3倍速とスキップはこの画面だけの仮想の時計で、配信・サーバーには影響しない。
 */
export function useRevealClock(serverTime: number, receivedAt: number | null, decidedAt: number) {
  const now = useMonotonicNow();
  const base =
    serverTime -
    decidedAt +
    (now === null || receivedAt === null ? 0 : Math.max(0, now - receivedAt));
  const [control, setControl] = useState<RevealControl>({
    skipped: false,
    rate: 1,
    anchorBase: 0,
    anchorVirtual: 0,
  });
  // 3倍速は切り替えた時点の仮想の経過を基準に、以後の実際の経過を3倍にする。戻しても進んだ分は戻らない。
  const elapsedMs = control.skipped
    ? Infinity
    : control.anchorVirtual + (base - control.anchorBase) * control.rate;
  return {
    elapsedMs,
    rate: control.skipped ? 1 : control.rate,
    setRate: (rate: 1 | 3) =>
      setControl((current) =>
        current.skipped
          ? current
          : { skipped: false, rate, anchorBase: base, anchorVirtual: elapsedMs },
      ),
    skip: () => setControl({ skipped: true }),
  };
}

/**
 * 0から`target`までを`durationMs`かけて数え上げる。`animate`が`false`なら最初から`target`。
 * 数える対象が変わったら、使う側で`key`を変えて数え直す。
 */
export function useCountUp(target: number, durationMs: number, animate: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!animate) return undefined;
    let frame = 0;
    const start = performance.now();
    const step = (time: number) => {
      const progress = Math.min(1, Math.max(0, (time - start) / durationMs));
      setValue(target * (1 - (1 - progress) ** 4));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, animate]);
  return animate ? value : target;
}
