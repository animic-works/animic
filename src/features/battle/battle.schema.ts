import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * お題。公開状態と日時の既定値は、管理画面より前にSQLで登録した行を今までどおり出題の対象にするためのもの。
 * 管理画面からは常に値を指定する。日時はUNIX時刻のミリ秒。
 */
export const topic = sqliteTable(
  "topic",
  {
    id: text("id").primaryKey(),
    difficulty: text("difficulty", { enum: ["easy", "normal", "hard"] }).notNull(),
    imageUrl: text("image_url").notNull(),
    // R2のキー。SQLで外部のURLを登録したお題はnull。
    imageKey: text("image_key"),
    title: text("title").notNull().default(""),
    note: text("note").notNull().default(""),
    status: text("status", { enum: ["published", "unpublished"] })
      .notNull()
      .default("published"),
    createdAt: integer("created_at").notNull().default(0),
    updatedAt: integer("updated_at").notNull().default(0),
  },
  (table) => [
    index("topic_status_difficulty_idx").on(table.status, table.difficulty),
    index("topic_updated_at_idx").on(table.updatedAt),
  ],
);

export const battleResult = sqliteTable("battle_result", {
  battleId: text("battle_id").primaryKey(),
  roomCode: text("room_code").notNull(),
  data: text("data").notNull(),
});

/**
 * 参加者ごとの戦績。マイページの一覧と成績を、`battle_result`のJSONを読まずに求めるためのもの。
 * `battle_result`と同じ書き込みで、保存する結果から求める（src/features/battle/battle-history.ts）。
 */
export const battleRecord = sqliteTable(
  "battle_record",
  {
    battleId: text("battle_id").notNull(),
    participantId: text("participant_id").notNull(),
    startedAt: integer("started_at").notNull(),
    difficulty: text("difficulty", { enum: ["easy", "normal", "hard"] }).notNull(),
    participantCount: integer("participant_count").notNull(),
    // 順位のない人（未提出・採点できなかった人・勝負不成立）はnull。
    rank: integer("rank"),
    // 採点されなかった人はnull。
    total: real("total"),
    // 未提出はnull。
    imageUrl: text("image_url"),
  },
  (table) => [
    primaryKey({ columns: [table.battleId, table.participantId] }),
    index("battle_record_participant_started_at_idx").on(table.participantId, table.startedAt),
  ],
);
