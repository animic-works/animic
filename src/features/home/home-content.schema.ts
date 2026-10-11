import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 遊び方・採点方法の項目（IDは`home-content.ts`の固定のID）。行がなければ既定の文言を使う。`imageId`は登録した画像 */
export const homeItem = sqliteTable("home_item", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageId: text("image_id"),
});

/** ギャラリーの例。画像はパス（初期データは`public/images/`、登録した画像は`/site-images/`）。 */
export const galleryItem = sqliteTable("gallery_item", {
  id: text("id").primaryKey(),
  difficulty: text("difficulty", { enum: ["easy", "normal", "hard"] }).notNull(),
  score: real("score").notNull(),
  ccip: real("ccip").notNull(),
  pixai: real("pixai").notNull(),
  siglip2: real("siglip2").notNull(),
  dinov2: real("dinov2").notNull(),
  depth: real("depth").notNull(),
  topicSrc: text("topic_src").notNull(),
  topicAlt: text("topic_alt").notNull(),
  shotSrc: text("shot_src").notNull(),
  shotAlt: text("shot_alt").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

/** サイト全体の設定（`og_image`: OGP画像の画像ID）。 */
export const siteSetting = sqliteTable("site_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
