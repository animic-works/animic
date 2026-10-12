import { useSyncExternalStore } from "react";

// 対戦画面の、この端末だけの設定と表示。ブラウザでしか読めないため、サーバーの描画では既定値を返す

const QUICK_SUBMIT_KEY = "animic-quick-submit";
// 同じタブで書き換えたときは storage イベントが届かないため、購読している部品へ直接知らせる
const quickSubmitListeners = new Set<() => void>();

function readQuickSubmit() {
  try {
    return localStorage.getItem(QUICK_SUBMIT_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeQuickSubmit(listener: () => void) {
  quickSubmitListeners.add(listener);
  // 別のタブで変えた設定も反映する
  const onStorage = (event: StorageEvent) => {
    if (event.key === QUICK_SUBMIT_KEY || event.key === null) listener();
  };
  addEventListener("storage", onStorage);
  return () => {
    quickSubmitListeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

function writeQuickSubmit(next: boolean) {
  try {
    localStorage.setItem(QUICK_SUBMIT_KEY, next ? "1" : "0");
  } catch {
    // 保存できない環境（ストレージを止めたブラウザなど）では、読み出しと同じくオフのままになる
  }
  for (const listener of quickSubmitListeners) listener();
}

/** 「確認なしですぐ提出」。localStorage `animic-quick-submit` に "1"/"0"。読めない環境と描画時（サーバー）はfalse */
export function useQuickSubmit(): readonly [boolean, (next: boolean) => void] {
  const quick = useSyncExternalStore(subscribeQuickSubmit, readQuickSubmit, () => false);
  return [quick, writeQuickSubmit] as const;
}

const noopSubscribe = () => () => {};
const readModifierKey = () =>
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";

/** ショートカットの案内の修飾キー。Mac/iPhone/iPadは"⌘"、それ以外は"Ctrl"。サーバーの描画では"⌘" */
export function useModifierKey(): "⌘" | "Ctrl" {
  return useSyncExternalStore(noopSubscribe, readModifierKey, () => "⌘");
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(listener: () => void) {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** 動きを減らす設定。サーバーの描画ではfalse */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
