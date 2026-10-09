import { useSyncExternalStore } from "react";
import * as v from "valibot";
const change = "animic-store-change";
function subscribe(listener: () => void) {
  window.addEventListener(change, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(change, listener);
    window.removeEventListener("storage", listener);
  };
}
function snapshot(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function parse<T>(raw: string | null, schema: v.GenericSchema<unknown, T>): T | null {
  try {
    const result = v.safeParse(schema, JSON.parse(raw ?? "null"));
    return result.success ? result.output : null;
  } catch {
    return null;
  }
}
export function readBrowserState<T>(key: string, schema: v.GenericSchema<unknown, T>) {
  return parse(snapshot(key), schema);
}
export function writeBrowserState(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(change));
}
export function useBrowserState<T>(key: string, schema: v.GenericSchema<unknown, T>) {
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(key),
    () => null,
  );
  return parse(raw, schema);
}
export function useBrowserReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
