import * as v from "valibot";

import { normalizeQuery } from "./prompt-dictionary";

// IDは管理画面で作るとUUID。書き出したファイルから読み込む場合も同じ文字に限る。
export const promptIdSchema = v.pipe(
  v.string(),
  v.regex(/^[A-Za-z0-9_-]{1,64}$/, "IDに使えない文字があります。"),
);
export const promptGroupLabelSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "グループの名前を入力してください。"),
  v.maxLength(20, "グループの名前は20文字以内で入力してください。"),
);
export const promptPhraseLabelSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "表示名を入力してください。"),
  v.maxLength(30, "表示名は30文字以内で入力してください。"),
);
export const promptPhraseSuffixSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(20, "サフィックスは20文字以内で入力してください。"),
);
export const promptPhraseTagSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "NovelAIへ送る語を入力してください。"),
  v.maxLength(200, "NovelAIへ送る語は200文字以内で入力してください。"),
);
export const promptPhraseNoteSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(100, "注釈は100文字以内で入力してください。"),
);

/** 別名の上限（件数・1件の文字数）。 */
export const maxPhraseAliases = 10;
export const maxPhraseAliasLength = 20;

/**
 * 別名。入力候補と検索だけに使う語で、画面には出さない。前後の空白を除き、
 * 空の語と、検索で同じ語になるもの（カタカナとひらがな・大文字と小文字の違い）は先の1つだけを残す。
 */
export const promptPhraseAliasesSchema = v.pipe(
  v.array(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(
        maxPhraseAliasLength,
        `別名は1件${maxPhraseAliasLength}文字以内で入力してください。`,
      ),
    ),
  ),
  v.transform((aliases) => {
    const seen = new Set<string>();
    return aliases.filter((alias) => {
      const key = normalizeQuery(alias);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }),
  v.maxLength(maxPhraseAliases, `別名は${maxPhraseAliases}件までにしてください。`),
);

/** 挿絵の画像ID。差し替えるたびに変え、配信URLも変える。 */
export const phraseImageIdSchema = v.pipe(v.string(), v.uuid());

/** グループの目印の色。対戦画面の検索で、ジャンルの名前の前に出す。 */
export const promptTones = [
  "ink",
  "pink",
  "rose",
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "forest",
  "cyan",
  "purple",
  "slate",
] as const;
export const promptToneSchema = v.picklist(promptTones);
export type PromptTone = v.InferOutput<typeof promptToneSchema>;

/** グループの表現を入れる欄。対戦画面の検索と入力候補で、開いている欄に合うグループを使う。 */
export const promptTargets = ["base", "character", "both"] as const;
export const promptTargetSchema = v.picklist(promptTargets);
export type PromptTarget = v.InferOutput<typeof promptTargetSchema>;

const sortOrderSchema = v.pipe(v.number(), v.integer());

// サフィックス・注釈・別名・挿絵・色・入れる欄は後から足したため、前の形式で書き出したファイルにはない。
export const promptPhraseSchema = v.object({
  id: promptIdSchema,
  label: promptPhraseLabelSchema,
  suffix: v.optional(promptPhraseSuffixSchema, ""),
  tag: promptPhraseTagSchema,
  note: v.optional(promptPhraseNoteSchema, ""),
  aliases: v.optional(promptPhraseAliasesSchema, []),
  imageId: v.optional(v.nullable(phraseImageIdSchema), null),
  sortOrder: sortOrderSchema,
});
export type PromptPhrase = v.InferOutput<typeof promptPhraseSchema>;

/** グループと、その中の表現（並び順）。書き出し・読み込みの形式にも使う。 */
export const promptGroupSchema = v.object({
  id: promptIdSchema,
  label: promptGroupLabelSchema,
  tone: v.optional(promptToneSchema, "slate"),
  target: v.optional(promptTargetSchema, "both"),
  sortOrder: sortOrderSchema,
  phrases: v.pipe(v.array(promptPhraseSchema), v.maxLength(500)),
});
export type PromptGroup = v.InferOutput<typeof promptGroupSchema>;

export const moveDirectionSchema = v.picklist(["up", "down"]);
