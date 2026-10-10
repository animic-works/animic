import { describe, expect, it } from "vite-plus/test";

import { readSavedPrompt, savePrompt } from "./prompt-storage";
import type { SavedPrompt } from "./prompt-storage";

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

const prompt: SavedPrompt = {
  mode: "tag",
  blocks: [[{ text: "white background", weight: 1 }], [{ text: "smile", weight: 1.2 }]],
  active: 0,
  draft: "sketch",
};

describe("プロンプトの保存", () => {
  it("同じ対戦の保存を戻し、別の対戦では使わない", () => {
    const storage = memoryStorage();
    savePrompt("battle-a", prompt, storage);
    expect(readSavedPrompt("battle-a", 1, storage)).toEqual(prompt);
    expect(readSavedPrompt("battle-b", 1, storage)).toBeNull();
  });

  it("別の対戦を保存すると、前の対戦の保存を消す", () => {
    const storage = memoryStorage();
    storage.setItem("animic-quick-submit", "1");
    savePrompt("battle-a", prompt, storage);
    savePrompt("battle-b", prompt, storage);
    expect(readSavedPrompt("battle-a", 1, storage)).toBeNull();
    expect(readSavedPrompt("battle-b", 1, storage)).toEqual(prompt);
    expect(storage.getItem("animic-quick-submit")).toBe("1");
  });

  it("形の合わない保存とキャラの上限を超える欄は使わない", () => {
    const storage = memoryStorage();
    storage.setItem("animic-prompt:broken", "{");
    expect(readSavedPrompt("broken", 1, storage)).toBeNull();
    storage.setItem(
      "animic-prompt:weight",
      JSON.stringify({ ...prompt, blocks: [[{ text: "a", weight: 3 }], []] }),
    );
    expect(readSavedPrompt("weight", 1, storage)).toBeNull();
    const three = { ...prompt, blocks: [[], [], []], active: 2 };
    savePrompt("three", three, storage);
    expect(readSavedPrompt("three", 1, storage)).toBeNull();
    expect(readSavedPrompt("three", 2, storage)).toEqual(three);
    savePrompt("active", { ...prompt, active: 2 }, storage);
    expect(readSavedPrompt("active", 2, storage)).toBeNull();
  });

  it("保存できない環境では何もしない", () => {
    expect(readSavedPrompt("battle-a", 1, null)).toBeNull();
    expect(() => savePrompt("battle-a", prompt, null)).not.toThrow();
  });
});
