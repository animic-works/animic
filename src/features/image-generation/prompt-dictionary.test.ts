import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import {
  browseDictionary,
  matchRange,
  normalizeQuery,
  phraseName,
  searchDictionary,
  wordOf,
} from "./prompt-dictionary";
import { initialPromptGroups } from "./prompt-dictionary-seed";
import { promptGroupSchema } from "./prompt-phrases";
import type { PromptGroup } from "./prompt-phrases";

describe("initialPromptGroups", () => {
  it("22ジャンル・266件で、タグが全体で重複しない", () => {
    expect(initialPromptGroups).toHaveLength(22);
    const tags = initialPromptGroups.flatMap((group) =>
      group.phrases.map((phrase) => phrase.tag.toLowerCase()),
    );
    expect(tags).toHaveLength(266);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("管理画面で保存できる値で、IDが重複しない", () => {
    for (const group of initialPromptGroups)
      expect(v.parse(promptGroupSchema, group)).toEqual(group);
    const ids = initialPromptGroups.flatMap((group) => [
      group.id,
      ...group.phrases.map((phrase) => phrase.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(initialPromptGroups[1]?.phrases[13]?.id).toBe("hair-two-tone-hair");
  });
});

describe("normalizeQuery", () => {
  it("カタカナをひらがなにし、空白を1つにそろえる", () => {
    expect(normalizeQuery(" ツインテ  ール ")).toBe("ついんて ーる");
  });
});

describe("searchDictionary", () => {
  it("日本語・タグのどちらでも探し、前方一致を先にする", () => {
    expect(searchDictionary(initialPromptGroups, "ついん")[0]?.label).toBe("ツインテール");
    expect(searchDictionary(initialPromptGroups, "hair")).toHaveLength(8);
    const tails = searchDictionary(initialPromptGroups, "tail", 20);
    const firstPartial = tails.findIndex((hit) => !hit.tag.startsWith("tail"));
    expect(tails.slice(firstPartial).every((hit) => !hit.tag.startsWith("tail"))).toBe(true);
    expect(tails[0]?.tag).toBe("tail");
    expect(searchDictionary(initialPromptGroups, "  ")).toEqual([]);
  });

  it("サフィックスも探し、注釈は探さない。欄に入れる言葉にサフィックスは含めない", () => {
    const groups: PromptGroup[] = [
      {
        id: "style",
        label: "髪型",
        tone: "amber",
        sortOrder: 0,
        phrases: [
          {
            id: "braids",
            label: "おさげ",
            suffix: "（2本の三つ編み）",
            tag: "twin braids",
            note: "肩の前に垂らすことが多い",
            sortOrder: 0,
          },
        ],
      },
    ];
    const [hit] = searchDictionary(groups, "三つ編み");
    expect(hit && phraseName(hit)).toBe("おさげ（2本の三つ編み）");
    expect(hit && wordOf(hit, "text")).toBe("おさげ");
    expect(hit && wordOf(hit, "tag")).toBe("twin braids");
    expect(searchDictionary(groups, "肩")).toEqual([]);
    expect(browseDictionary(groups, null, "肩")).toEqual([]);
  });
});

describe("browseDictionary", () => {
  it("検索語があればジャンル名でも探し、なければ選んだジャンルを並べる", () => {
    expect(browseDictionary(initialPromptGroups, null, "髪型").map((hit) => hit.tag)).toContain(
      "ponytail",
    );
    const bg = browseDictionary(initialPromptGroups, "bg", "");
    expect(bg.length).toBeGreaterThan(0);
    expect(bg.every((hit) => hit.group.id === "bg")).toBe(true);
    expect(browseDictionary(initialPromptGroups, null, "")).toHaveLength(266);
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
