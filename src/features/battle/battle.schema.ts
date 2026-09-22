import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const topic = sqliteTable(
  "topic",
  {
    id: text("id").primaryKey(),
    difficulty: text("difficulty", { enum: ["easy", "normal", "hard"] }).notNull(),
    imageUrl: text("image_url").notNull(),
  },
  (table) => [index("topic_difficulty_idx").on(table.difficulty)],
);

export const battleResult = sqliteTable("battle_result", {
  battleId: text("battle_id").primaryKey(),
  roomCode: text("room_code").notNull(),
  data: text("data").notNull(),
});
