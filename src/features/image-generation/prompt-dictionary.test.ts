import { describe, expect, it } from "vite-plus/test";

import {
  browseDictionary,
  matchRange,
  normalizeQuery,
  promptDictionary,
  searchDictionary,
} from "./prompt-dictionary";

describe("promptDictionary", () => {
  it("22ジャンルで、タグが全体で重複しない", () => {
    expect(promptDictionary).toHaveLength(22);
    const tags = promptDictionary.flatMap((group) =>
      group.entries.map((entry) => entry.tag.toLowerCase()),
    );
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe("normalizeQuery", () => {
  it("カタカナをひらがなにし、空白を1つにそろえる", () => {
    expect(normalizeQuery(" ツインテ  ール ")).toBe("ついんて ーる");
  });
});

describe("searchDictionary", () => {
  it("日本語・タグのどちらでも探し、前方一致を先にする", () => {
    expect(searchDictionary(promptDictionary, "ついん")[0]?.ja).toBe("ツインテール");
    expect(searchDictionary(promptDictionary, "hair")).toHaveLength(8);
    const tails = searchDictionary(promptDictionary, "tail", 20);
    const firstPartial = tails.findIndex((hit) => !hit.tag.startsWith("tail"));
    expect(tails.slice(firstPartial).every((hit) => !hit.tag.startsWith("tail"))).toBe(true);
    expect(tails[0]?.tag).toBe("tail");
    expect(searchDictionary(promptDictionary, "  ")).toEqual([]);
  });
});

describe("browseDictionary", () => {
  it("検索語があればジャンル名でも探し、なければ選んだジャンルを並べる", () => {
    expect(browseDictionary(promptDictionary, null, "髪型").map((hit) => hit.tag)).toContain(
      "ponytail",
    );
    const bg = browseDictionary(promptDictionary, "bg", "");
    expect(bg.length).toBeGreaterThan(0);
    expect(bg.every((hit) => hit.group.key === "bg")).toBe(true);
    expect(browseDictionary(promptDictionary, null, "")).toHaveLength(266);
  });
});

describe("matchRange", () => {
  it("元の文字列での強調範囲を返す", () => {
    expect(matchRange("ツインテール", "ついん")).toEqual([0, 3]);
    expect(matchRange("pink hair", "HAIR")).toEqual([5, 9]);
    expect(matchRange("pink hair", "")).toBeNull();
    expect(matchRange("pink hair", "eyes")).toBeNull();
  });
});
