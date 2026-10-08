import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** プロンプト入力の「よく使う表現」のグループ。 */
export const promptGroup = sqliteTable("prompt_group", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

/** よく使う表現。`label`は画面に出す名前、`tag`はNovelAIへ送る語。 */
export const promptPhrase = sqliteTable(
  "prompt_phrase",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => promptGroup.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    tag: text("tag").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    index("prompt_phrase_group_sort_idx").on(table.groupId, table.sortOrder),
    uniqueIndex("prompt_phrase_group_tag_idx").on(table.groupId, table.tag),
  ],
);
