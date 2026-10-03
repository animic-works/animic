import { useSyncExternalStore } from "react";

// 残り時間は配信時のサーバー時刻と期限を基準にし、受信後の経過時間にはブラウザーの単調増加時計を使う。
// 端末の時計設定を締切判定に使わず、表示が0秒になったことだけで提出状態を確定しない
let serverTime = 0;
let receivedAt = 0;
let current = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/** 状態を受信したときに、その配信時のサーバー時刻で時計を合わせる */
export function syncServerClock(time: number) {
  serverTime = time;
  receivedAt = performance.now();
  current = time;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = setInterval(() => {
      current = serverTime + (performance.now() - receivedAt);
      emit();
    }, 200);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

/** 今のサーバー時刻の見積もり。まだ合わせていなければ、受け取った状態の配信時刻を使う */
export function useServerNow(fallback: number) {
  const now = useSyncExternalStore(
    subscribe,
    () => current,
    () => 0,
  );
  return now || fallback;
}

// 残り秒を m:ss にする
export function formatSeconds(seconds: number) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
