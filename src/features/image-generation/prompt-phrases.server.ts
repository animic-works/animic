import { and, asc, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import type { PromptGroup, PromptPhrase } from "./prompt-phrases";
import { promptGroup, promptPhrase } from "./prompt-phrases.schema";

/** グループと表現を並び順で読む。 */
export async function loadPromptGroups(db: D1Database): Promise<PromptGroup[]> {
  const client = drizzle(db);
  const [groups, phrases] = await Promise.all([
    client.select().from(promptGroup).orderBy(asc(promptGroup.sortOrder), asc(promptGroup.id)),
    client.select().from(promptPhrase).orderBy(asc(promptPhrase.sortOrder), asc(promptPhrase.id)),
  ]);
  return groups.map((group) => ({
    ...group,
    phrases: phrases
      .filter((phrase) => phrase.groupId === group.id)
      .map(({ id, label, tag, sortOrder }) => ({ id, label, tag, sortOrder })),
  }));
}

/** グループを上書きまたは追加する書き込み（表現は含めない）。 */
export function upsertPromptGroup(db: D1Database, group: Omit<PromptGroup, "phrases">) {
  const { id, label, sortOrder } = group;
  return drizzle(db)
    .insert(promptGroup)
    .values({ id, label, sortOrder })
    .onConflictDoUpdate({ target: promptGroup.id, set: { label, sortOrder } });
}

/**
 * 表現を上書きまたは追加する書き込み。同じグループに同じ語の別の表現があれば、同じ表現として置き換える。
 * 2つの書き込みを、この順で同じ`batch`に入れる。
 */
export function upsertPromptPhrase(db: D1Database, groupId: string, phrase: PromptPhrase) {
  const client = drizzle(db);
  const { id, label, tag, sortOrder } = phrase;
  return [
    client
      .delete(promptPhrase)
      .where(
        and(eq(promptPhrase.groupId, groupId), eq(promptPhrase.tag, tag), ne(promptPhrase.id, id)),
      ),
    client
      .insert(promptPhrase)
      .values({ id, groupId, label, tag, sortOrder })
      .onConflictDoUpdate({ target: promptPhrase.id, set: { groupId, label, tag, sortOrder } }),
  ] as const;
}
