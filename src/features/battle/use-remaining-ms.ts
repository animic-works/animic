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

/** 配信時刻と受信後の経過から数え、画面の演出や端末時計の変更で締切を延ばさない。 */
export function useRemainingMs(
  serverTime: number,
  deadline: number | null,
  receivedAt: number | null,
) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const elapsed = current === null || receivedAt === null ? 0 : Math.max(0, current - receivedAt);
  return deadline === null ? null : Math.max(0, deadline - serverTime - elapsed);
}
