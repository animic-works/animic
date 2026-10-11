import * as v from "valibot";
import migration from "../../../migrations/0011_phrase-aliases.sql?raw";
import { describe, expect, it } from "vite-plus/test";

import {
  browseDictionary,
  convertBlocks,
  groupsForBlock,
  matchRange,
  normalizeQuery,
  phraseName,
  searchDictionary,
  wordOf,
} from "./prompt-dictionary";
import { initialPromptGroups } from "./prompt-dictionary-seed";
import { promptGroupSchema, promptPhraseAliasesSchema } from "./prompt-phrases";
import type { PromptGroup } from "./prompt-phrases";

describe("initialPromptGroups", () => {
  it("23ジャンル・266件で、タグが全体で重複しない", () => {
    expect(initialPromptGroups).toHaveLength(23);
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

describe("初期データの別名", () => {
  const phrases = initialPromptGroups.flatMap((group) => group.phrases);

  it("保存できる値（件数・長さ・重複）で、どの表現の表示名とも同じでない", () => {
    const labels = new Set(phrases.map((phrase) => normalizeQuery(phrase.label)));
    expect(phrases.filter((phrase) => phrase.aliases.length > 0)).toHaveLength(149);
    for (const phrase of phrases) {
      expect(v.parse(promptPhraseAliasesSchema, phrase.aliases)).toEqual(phrase.aliases);
      for (const alias of phrase.aliases) expect(labels.has(normalizeQuery(alias))).toBe(false);
    }
  });

  it("代表的な別名で入力候補に出る", () => {
    for (const [query, label] of [
      ["ツインテ", "ツインテール"],
      ["すまいる", "笑顔"],
      ["ねこみみ", "猫耳"],
    ])
      expect(searchDictionary(initialPromptGroups, query).map((hit) => hit.label)).toContain(label);
  });

  it("マイグレーションで、既存の環境の初期データの表現に同じ別名を入れる", () => {
    const updates = [
      ...migration.matchAll(
        /UPDATE `prompt_phrase` SET `aliases` = '([^']*)' WHERE `id` = '([^']+)' AND `aliases` = '\[\]';/g,
      ),
    ].map(([, aliases = "", id = ""]) => [id, v.parse(v.array(v.string()), JSON.parse(aliases))]);
    const seeded = Object.fromEntries(
      phrases
        .filter((phrase) => phrase.aliases.length > 0)
        .map((phrase) => [phrase.id, phrase.aliases]),
    );
    // 0009で「天気」へ移した既存の環境の表現は、IDが`scene-`のまま残る。
    expect(Object.fromEntries(updates)).toEqual({
      ...seeded,
      "scene-sunset": seeded["weather-sunset"],
    });
    expect(updates).toHaveLength(150);
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
        target: "character",
        sortOrder: 0,
        phrases: [
          {
            id: "braids",
            label: "おさげ",
            suffix: "（2本の三つ編み）",
            tag: "twin braids",
            note: "肩の前に垂らすことが多い",
            aliases: [],
            imageId: null,
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

describe("別名", () => {
  const groups: PromptGroup[] = [
    {
      id: "style",
      label: "髪型",
      tone: "amber",
      target: "character",
      sortOrder: 0,
      phrases: [
        {
          id: "side",
          label: "サイドテール",
          suffix: "",
          tag: "side ponytail",
          note: "",
          aliases: ["片側結び"],
          imageId: null,
          sortOrder: 0,
        },
        {
          id: "twin",
          label: "ツインテール",
          suffix: "",
          tag: "twintails",
          note: "",
          aliases: ["ツインテ", "二つ結い"],
          imageId: null,
          sortOrder: 1,
        },
      ],
    },
  ];

  it("入力候補と検索で別名でも探し、カタカナとひらがなを区別しない。前方一致を先にする", () => {
    expect(searchDictionary(groups, "二つ結い").map((hit) => hit.id)).toEqual(["twin"]);
    expect(browseDictionary(groups, null, "二つ").map((hit) => hit.id)).toEqual(["twin"]);
    // 「ついんて」は表示名と別名の両方に前方一致し、「結び」「結い」は別名の途中にだけある。
    expect(searchDictionary(groups, "ついんて").map((hit) => hit.id)).toEqual(["twin"]);
    expect(searchDictionary(groups, "結").map((hit) => hit.id)).toEqual(["side", "twin"]);
    expect(searchDictionary(groups, "片側").map((hit) => hit.id)).toEqual(["side"]);
    // 別名にだけ前方一致する表現を、表示名の途中に含むだけの表現より先にする。
    expect(searchDictionary(groups, "てーる").map((hit) => hit.id)).toEqual(["side", "twin"]);
    const [style] = groups;
    const aliased = style && [
      {
        ...style,
        phrases: style.phrases.map((phrase) => ({
          ...phrase,
          aliases: phrase.id === "twin" ? ["テール2本"] : [],
        })),
      },
    ];
    expect(aliased && searchDictionary(aliased, "てーる").map((hit) => hit.id)).toEqual([
      "twin",
      "side",
    ]);
    // 表示名で出し、欄に入れる語も変えない。
    const [hit] = searchDictionary(groups, "二つ結い");
    expect(hit && phraseName(hit)).toBe("ツインテール");
    expect(hit && wordOf(hit, "tag")).toBe("twintails");
  });

  it("前後の空白と空の語を除き、検索で同じになる語（かな・大文字小文字の違い）は先の1つだけを残す", () => {
    expect(
      v.parse(promptPhraseAliasesSchema, [
        " ツインテ ",
        "",
        "  ",
        "ついんて",
        "Twin",
        "TWIN",
        "二つ結い",
      ]),
    ).toEqual(["ツインテ", "Twin", "二つ結い"]);
  });

  it("1件20文字・10件を超えると保存しない（除いた後の件数で数える）", () => {
    expect(v.safeParse(promptPhraseAliasesSchema, ["あ".repeat(20)]).success).toBe(true);
    expect(v.safeParse(promptPhraseAliasesSchema, ["あ".repeat(21)]).issues?.[0]?.message).toBe(
      "別名は1件20文字以内で入力してください。",
    );
    const ten = Array.from({ length: 10 }, (_, index) => `別名${index}`);
    expect(v.safeParse(promptPhraseAliasesSchema, [...ten, "別名0", ""]).success).toBe(true);
    expect(v.safeParse(promptPhraseAliasesSchema, [...ten, "別名10"]).issues?.[0]?.message).toBe(
      "別名は10件までにしてください。",
    );
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

describe("convertBlocks", () => {
  it("辞書にある語句を切り替え先の表記にし、重みと辞書にない語句は変えない", () => {
    const blocks = [
      [{ text: "白背景", weight: 1 }],
      [
        { text: "1人の女の子", weight: 1.2 },
        { text: "きらきらの瞳", weight: 1 },
      ],
    ];
    const tags = convertBlocks(blocks, initialPromptGroups, "text", "tag");
    expect(tags).toEqual([
      [{ text: "white background", weight: 1 }],
      [
        { text: "1girl", weight: 1.2 },
        { text: "きらきらの瞳", weight: 1 },
      ],
    ]);
    expect(convertBlocks(tags, initialPromptGroups, "tag", "text")).toEqual(blocks);
  });

  it("大文字小文字を区別せずに照らし、置き換えで重なった語句は前だけを残す", () => {
    const blocks = [
      [],
      [
        { text: "1GIRL", weight: 1 },
        { text: "1人の女の子", weight: 1.5 },
      ],
    ];
    expect(convertBlocks(blocks, initialPromptGroups, "tag", "text")).toEqual([
      [],
      [{ text: "1人の女の子", weight: 1 }],
    ]);
  });
});

const targetsOf = (block: number) =>
  new Set(groupsForBlock(initialPromptGroups, block).map((group) => group.target));

describe("groupsForBlock", () => {
  it("ベースの欄にはベース・両方、キャラの欄にはキャラ・両方のグループを使う", () => {
    expect(targetsOf(0)).toEqual(new Set(["base"]));
    expect(targetsOf(1)).toEqual(new Set(["character"]));
    const both = { ...initialPromptGroups[0], id: "both", target: "both" as const };
    for (const block of [0, 1, 2])
      expect(groupsForBlock([both], block).map((group) => group.id)).toEqual(["both"]);
    expect(groupsForBlock(initialPromptGroups, 0).map((group) => group.id)).toEqual(
      expect.arrayContaining(["who", "season"]),
    );
    expect(groupsForBlock(initialPromptGroups, 1).map((group) => group.id)).toEqual(
      expect.arrayContaining(["hair", "comp"]),
    );
  });
});
