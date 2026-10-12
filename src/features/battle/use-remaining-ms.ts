import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let now: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
function tick() {
  now = performance.now();
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick();
    timer = setInterval(tick, 200);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) clearInterval(timer);
  };
}
const getSnapshot = () => now;
const getServerSnapshot = () => null;
const subscribeNothing = () => () => {};

/**
 * 配信時のサーバー時刻に受信後の経過（単調増加時計を200ms刻みで読む）を足した、今のサーバー時刻。
 * 端末の時計は使わない。`active`が`false`の間は時計を読み直さず、描画し直さない。
 */
export function useServerNow(serverTime: number, receivedAt: number | null, active = true) {
  const current = useSyncExternalStore(
    active ? subscribe : subscribeNothing,
    getSnapshot,
    getServerSnapshot,
  );
  return (
    serverTime + (current === null || receivedAt === null ? 0 : Math.max(0, current - receivedAt))
  );
}

/** 配信時刻と受信後の経過から数え、画面の演出や端末時計の変更で締切を延ばさない。 */
export function useRemainingMs(
  serverTime: number,
  deadline: number | null,
  receivedAt: number | null,
) {
  const current = useServerNow(serverTime, receivedAt);
  return deadline === null ? null : Math.max(0, deadline - current);
}
