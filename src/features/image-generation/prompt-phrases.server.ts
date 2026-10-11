import { and, asc, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { initialPromptGroups } from "./prompt-dictionary-seed";
import type { PromptGroup, PromptPhrase } from "./prompt-phrases";
import { promptGroup, promptPhrase } from "./prompt-phrases.schema";

/** D1の1つのクエリに渡せる値の数の上限。 */
const maxBoundParameters = 100;

async function readPromptGroups(db: D1Database): Promise<PromptGroup[]> {
  const client = drizzle(db);
  const [groups, phrases] = await Promise.all([
    client.select().from(promptGroup).orderBy(asc(promptGroup.sortOrder), asc(promptGroup.id)),
    client.select().from(promptPhrase).orderBy(asc(promptPhrase.sortOrder), asc(promptPhrase.id)),
  ]);
  return groups.map((group) => ({
    ...group,
    phrases: phrases
      .filter((phrase) => phrase.groupId === group.id)
      .map(({ groupId: _groupId, ...phrase }) => phrase),
  }));
}

/**
 * 初期データを登録する。IDが固定のため、同時に呼ばれても同じ内容が1回だけ入る。
 * 表現は、1つのクエリの値の数が上限に収まる件数ずつ入れる。
 */
async function insertInitialPromptGroups(db: D1Database) {
  const client = drizzle(db);
  const groups = initialPromptGroups.map(({ phrases: _phrases, ...group }) => group);
  const phrases = initialPromptGroups.flatMap((group) =>
    group.phrases.map((phrase) => ({ ...phrase, groupId: group.id })),
  );
  const [first] = phrases;
  const size = first ? Math.floor(maxBoundParameters / Object.keys(first).length) : 1;
  const inserts = [];
  for (let index = 0; index < phrases.length; index += size)
    inserts.push(
      client
        .insert(promptPhrase)
        .values(phrases.slice(index, index + size))
        .onConflictDoNothing(),
    );
  await client.batch([client.insert(promptGroup).values(groups).onConflictDoNothing(), ...inserts]);
}

/** グループと表現を並び順で読む。グループが1つもなければ、先に初期データを登録する。 */
export async function loadPromptGroups(db: D1Database): Promise<PromptGroup[]> {
  const groups = await readPromptGroups(db);
  if (groups.length > 0) return groups;
  await insertInitialPromptGroups(db);
  return readPromptGroups(db);
}

/** グループを上書きまたは追加する書き込み（表現は含めない）。 */
export function upsertPromptGroup(db: D1Database, group: Omit<PromptGroup, "phrases">) {
  const { id, label, tone, sortOrder } = group;
  return drizzle(db)
    .insert(promptGroup)
    .values({ id, label, tone, sortOrder })
    .onConflictDoUpdate({ target: promptGroup.id, set: { label, tone, sortOrder } });
}

/**
 * 表現を上書きまたは追加する書き込み。同じグループに同じ語の別の表現があれば、同じ表現として置き換える。
 * 2つの書き込みを、この順で同じ`batch`に入れる。
 */
export function upsertPromptPhrase(db: D1Database, groupId: string, phrase: PromptPhrase) {
  const client = drizzle(db);
  const { id, label, suffix, tag, note, sortOrder } = phrase;
  return [
    client
      .delete(promptPhrase)
      .where(
        and(eq(promptPhrase.groupId, groupId), eq(promptPhrase.tag, tag), ne(promptPhrase.id, id)),
      ),
    client
      .insert(promptPhrase)
      .values({ id, groupId, label, suffix, tag, note, sortOrder })
      .onConflictDoUpdate({
        target: promptPhrase.id,
        set: { groupId, label, suffix, tag, note, sortOrder },
      }),
  ] as const;
}
