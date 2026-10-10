// 対戦中のプロンプト（すべての欄の語句・書きかけ・入力方法・選んでいる欄）を、このタブのsessionStorageへ対戦ごとに保存する。
// 再接続・再読み込みで画面を作り直しても入力を戻すため。別の対戦の保存は読まず、保存するときに消す

import { useMemo, useSyncExternalStore } from "react";
import * as v from "valibot";
import { MAX_WEIGHT, MIN_WEIGHT } from "./prompt-blocks";
import type { PromptBlocks, PromptMode } from "./prompt-blocks";

export type SavedPrompt = {
  mode: PromptMode;
  blocks: PromptBlocks;
  active: number;
  draft: string;
};

const KEY_PREFIX = "animic-prompt:";

const savedPromptSchema = v.object({
  mode: v.picklist(["text", "tag"]),
  blocks: v.array(
    v.array(
      v.object({
        text: v.pipe(v.string(), v.minLength(1)),
        weight: v.pipe(v.number(), v.minValue(MIN_WEIGHT), v.maxValue(MAX_WEIGHT)),
      }),
    ),
  ),
  active: v.pipe(v.number(), v.integer(), v.minValue(0)),
  draft: v.string(),
});

const keyOf = (battleId: string) => `${KEY_PREFIX}${battleId}`;

function defaultStorage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(battleId: string, storage: Storage | null): string | null {
  try {
    return storage?.getItem(keyOf(battleId)) ?? null;
  } catch {
    return null;
  }
}

function parseSavedPrompt(raw: string | null, maxCharacters: 1 | 2): SavedPrompt | null {
  if (!raw) return null;
  try {
    const parsed = v.safeParse(savedPromptSchema, JSON.parse(raw));
    if (!parsed.success) return null;
    const saved = parsed.output;
    if (saved.blocks.length < 2 || saved.blocks.length > maxCharacters + 1) return null;
    if (saved.active >= saved.blocks.length) return null;
    return saved;
  } catch {
    return null;
  }
}

/** 対戦の保存を読む。ない・読めない・形が合わない（欄の数がキャラの上限を超えるなど）ときはnull */
export function readSavedPrompt(
  battleId: string,
  maxCharacters: 1 | 2,
  storage = defaultStorage(),
): SavedPrompt | null {
  return parseSavedPrompt(readRaw(battleId, storage), maxCharacters);
}

const noopSubscribe = () => () => {};

/** 画面で使う対戦の保存。サーバーの描画とハイドレーションではnullを返し、その後に保存を読む */
export function useSavedPrompt(battleId: string, maxCharacters: 1 | 2): SavedPrompt | null {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => readRaw(battleId, defaultStorage()),
    () => null,
  );
  return useMemo(() => parseSavedPrompt(raw, maxCharacters), [raw, maxCharacters]);
}

/** 対戦の入力を保存し、ほかの対戦の保存を消す。保存できない環境では何もしない */
export function savePrompt(battleId: string, prompt: SavedPrompt, storage = defaultStorage()) {
  if (!storage) return;
  try {
    const key = keyOf(battleId);
    for (let index = storage.length - 1; index >= 0; index--) {
      const other = storage.key(index);
      if (other?.startsWith(KEY_PREFIX) && other !== key) storage.removeItem(other);
    }
    storage.setItem(key, JSON.stringify(prompt));
  } catch {
    // 容量の上限やストレージを止めたブラウザでは保存しない（画面の入力はそのまま使える）
  }
}
