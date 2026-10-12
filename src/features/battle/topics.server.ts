import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { topic } from "./battle.schema";
import type { AdminTopic } from "./topic-admin";

/** すべてのお題（作成順）。書き出しに使う。 */
export function loadAllTopics(db: D1Database) {
  return drizzle(db).select().from(topic).orderBy(asc(topic.createdAt), asc(topic.id));
}

/** お題を上書きまたは追加する書き込み。D1の`batch`に入れて使う。 */
export function upsertTopic(db: D1Database, { id, ...fields }: AdminTopic) {
  return drizzle(db)
    .insert(topic)
    .values({ id, ...fields })
    .onConflictDoUpdate({ target: topic.id, set: fields });
}
