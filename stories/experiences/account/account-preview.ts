import { useSyncExternalStore } from "react";
import * as v from "valibot";
import { parseHistory, historyEntrySchema, type HistoryEntry } from "./history-entry";

export interface AccountPreview {
  id: string;
  name: string;
  provider: "Google" | "Discord";
  image?: string;
  color?: string;
}

function readStore(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function parseAccount(value: unknown): AccountPreview | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("name" in value) ||
    typeof value.name !== "string" ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !value.id ||
    !("provider" in value) ||
    (value.provider !== "Google" && value.provider !== "Discord")
  )
    return null;
  const icon = "icon" in value ? value.icon : undefined;
  const image =
    icon && typeof icon === "object" && "src" in icon && typeof icon.src === "string"
      ? icon.src
      : undefined;
  const color =
    icon && typeof icon === "object" && "color" in icon && typeof icon.color === "string"
      ? icon.color.toLowerCase()
      : undefined;
  return {
    id: value.id,
    name: value.name,
    provider: value.provider,
    image,
    color,
  };
}

const changeEvent = "animic-experience-account-change";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("pageshow", listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("pageshow", listener);
    window.removeEventListener(changeEvent, listener);
  };
}
function snapshot(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function parseSnapshot(value: string | null): unknown {
  try {
    return JSON.parse(value ?? "null");
  } catch {
    return null;
  }
}
export function useAccountPreview() {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot("animic-experience-account"),
    () => null,
  );
  return parseAccount(parseSnapshot(value));
}
function historyKey() {
  const account = parseAccount(readStore("animic-experience-account"));
  if (!account) return null;
  return `animic-experience-history:${account.id}`;
}
export function useResultsPreview() {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const key = historyKey();
      return key ? snapshot(key) : null;
    },
    () => null,
  );
  const results = parseSnapshot(value);
  return parseHistory(results);
}

export function saveHistory(entry: HistoryEntry) {
  const key = historyKey();
  if (!key) throw new Error("戦績の保存にはアカウントが必要です。");
  const history = parseHistory(readStore(key));
  if (history.some((item) => item.key === entry.key)) return;
  localStorage.setItem(key, JSON.stringify([entry, ...history].slice(0, 100)));
  window.dispatchEvent(new Event(changeEvent));
}
export function keepPendingResult(entry: HistoryEntry) {
  sessionStorage.setItem("animic-experience-pending-result", JSON.stringify(entry));
  window.dispatchEvent(new Event(changeEvent));
}
function pendingSnapshot() {
  try {
    return sessionStorage.getItem("animic-experience-pending-result");
  } catch {
    return null;
  }
}
export function usePendingResultPreview() {
  const raw = useSyncExternalStore(subscribe, pendingSnapshot, () => null);
  const result = v.safeParse(historyEntrySchema, parseSnapshot(raw));
  return result.success ? result.output : null;
}
export function savePendingResult() {
  const raw = sessionStorage.getItem("animic-experience-pending-result");
  if (!raw) return false;
  const result = v.safeParse(historyEntrySchema, parseSnapshot(raw));
  if (!result.success) return false;
  saveHistory(result.output);
  sessionStorage.removeItem("animic-experience-pending-result");
  window.dispatchEvent(new Event(changeEvent));
  return true;
}

export function signOut() {
  localStorage.removeItem("animic-experience-account");
  window.dispatchEvent(new Event(changeEvent));
}

export function saveAccount(account: Omit<AccountPreview, "id"> & { id?: string }) {
  const identityKey = `animic-experience-account-id:${account.provider}`;
  const id = account.id ?? localStorage.getItem(identityKey) ?? crypto.randomUUID();
  localStorage.setItem(identityKey, id);
  localStorage.setItem(
    "animic-experience-account",
    JSON.stringify({
      id,
      name: account.name,
      provider: account.provider,
      icon: { src: account.image, color: account.color },
    }),
  );
  localStorage.setItem("animic-experience-name", account.name);
  window.dispatchEvent(new Event(changeEvent));
}

export function rememberName(name: string) {
  localStorage.setItem("animic-experience-name", name);
}

export function lastName() {
  try {
    return localStorage.getItem("animic-experience-name") ?? "";
  } catch {
    return "";
  }
}
