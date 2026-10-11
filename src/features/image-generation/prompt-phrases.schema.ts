import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { promptTargets, promptTones } from "./prompt-phrases";

/** 表現の辞書のグループ。対戦画面の検索ではジャンルとして並べる。`target`は表現を入れる欄（ベース・キャラ・両方）。 */
export const promptGroup = sqliteTable("prompt_group", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  tone: text("tone", { enum: promptTones }).notNull().default("slate"),
  target: text("target", { enum: promptTargets }).notNull().default("both"),
  sortOrder: integer("sort_order").notNull(),
});

/**
 * 表現の辞書の表現。`label`は画面に出す名前で、文章入力ではプロンプトにも入る。
 * `suffix`は表示名の後ろに出す補足、`tag`はタグ入力でプロンプトに入る語、`note`は検索のカードに出す注釈。
 * `imageId`は検索のカードに出す挿絵（R2の`PHRASE_IMAGES`）の画像ID。
 */
export const promptPhrase = sqliteTable(
  "prompt_phrase",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => promptGroup.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    suffix: text("suffix").notNull().default(""),
    tag: text("tag").notNull(),
    note: text("note").notNull().default(""),
    imageId: text("image_id"),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    index("prompt_phrase_group_sort_idx").on(table.groupId, table.sortOrder),
    uniqueIndex("prompt_phrase_group_tag_idx").on(table.groupId, table.tag),
  ],
);
