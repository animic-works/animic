import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** ロビーで選べる対戦条件の候補。行がない種類は`battle-options.ts`の既定の候補を使う。 */
export const battleOption = sqliteTable(
  "battle_option",
  {
    kind: text("kind", { enum: ["duration", "selection"] }).notNull(),
    seconds: integer("seconds").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.kind, table.seconds] })],
);
