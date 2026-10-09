import { useSyncExternalStore } from "react";
const key = "animic-quick-submit";
const event = "animic-submit-preference";
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener("storage", listener);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
export function useQuickSubmit() {
  const checked = useSyncExternalStore(subscribe, snapshot, () => false);
  return [
    checked,
    (value: boolean) => {
      localStorage.setItem(key, value ? "1" : "0");
      window.dispatchEvent(new Event(event));
    },
  ] as const;
}
