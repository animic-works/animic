import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, gt, lt, max, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import {
  moveDirectionSchema,
  promptGroupLabelSchema,
  promptIdSchema,
  promptPhraseLabelSchema,
  promptPhraseNoteSchema,
  promptPhraseSuffixSchema,
  promptPhraseTagSchema,
  promptToneSchema,
} from "./prompt-phrases";
import { promptGroup, promptPhrase } from "./prompt-phrases.schema";
import { loadPromptGroups } from "./prompt-phrases.server";

/**
 * 表現の辞書（グループと表現）。管理画面と、対戦画面の入力候補・検索で使う。
 * 参加前の人にも見せてよい情報のため認証しない。
 */
export const listPromptGroups = createServerFn({ method: "GET" }).handler(() =>
  loadPromptGroups(env.DB),
);

/** グループを追加する（最後に並べる）か、名前と色を変える。 */
export const savePromptGroup = createServerFn({ method: "POST" })
  .validator(
    v.object({ id: promptIdSchema, label: promptGroupLabelSchema, tone: promptToneSchema }),
  )
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const [last] = await db.select({ value: max(promptGroup.sortOrder) }).from(promptGroup);
    await db
      .insert(promptGroup)
      .values({
        id: data.id,
        label: data.label,
        tone: data.tone,
        sortOrder: (last?.value ?? -1) + 1,
      })
      .onConflictDoUpdate({
        target: promptGroup.id,
        set: { label: data.label, tone: data.tone },
      });
  });

/** グループを削除する。中の表現も一緒に消える。 */
export const deletePromptGroup = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string() }))
  .handler(async ({ data }) => {
    requireAdmin();
    await drizzle(env.DB).delete(promptGroup).where(eq(promptGroup.id, data.id));
  });

/** 表現を追加する（グループの最後に並べる）か、内容を変える。同じグループに同じ語があれば保存しない。 */
export const savePromptPhrase = createServerFn({ method: "POST" })
  .validator(
    v.object({
      id: promptIdSchema,
      groupId: v.string(),
      label: promptPhraseLabelSchema,
      suffix: promptPhraseSuffixSchema,
      tag: promptPhraseTagSchema,
      note: promptPhraseNoteSchema,
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const [group] = await db
      .select({ id: promptGroup.id })
      .from(promptGroup)
      .where(eq(promptGroup.id, data.groupId));
    if (!group) return { error: "グループが見つかりません。" };
    const [duplicate] = await db
      .select({ id: promptPhrase.id })
      .from(promptPhrase)
      .where(
        and(
          eq(promptPhrase.groupId, data.groupId),
          eq(promptPhrase.tag, data.tag),
          ne(promptPhrase.id, data.id),
        ),
      );
    if (duplicate) return { error: "このグループには同じ語の表現があります。" };
    const [last] = await db
      .select({ value: max(promptPhrase.sortOrder) })
      .from(promptPhrase)
      .where(eq(promptPhrase.groupId, data.groupId));
    await db
      .insert(promptPhrase)
      .values({
        id: data.id,
        groupId: data.groupId,
        label: data.label,
        suffix: data.suffix,
        tag: data.tag,
        note: data.note,
        sortOrder: (last?.value ?? -1) + 1,
      })
      .onConflictDoUpdate({
        target: promptPhrase.id,
        set: { label: data.label, suffix: data.suffix, tag: data.tag, note: data.note },
      });
    return { error: null };
  });

export const deletePromptPhrase = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string() }))
  .handler(async ({ data }) => {
    requireAdmin();
    await drizzle(env.DB).delete(promptPhrase).where(eq(promptPhrase.id, data.id));
  });

/** グループを1つ上または下へ動かす（隣と並び順を入れ替える）。端なら何もしない。 */
export const movePromptGroup = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string(), direction: moveDirectionSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const [current] = await db.select().from(promptGroup).where(eq(promptGroup.id, data.id));
    if (!current) return;
    const up = data.direction === "up";
    const [neighbor] = await db
      .select()
      .from(promptGroup)
      .where(
        up
          ? lt(promptGroup.sortOrder, current.sortOrder)
          : gt(promptGroup.sortOrder, current.sortOrder),
      )
      .orderBy(up ? desc(promptGroup.sortOrder) : asc(promptGroup.sortOrder))
      .limit(1);
    if (!neighbor) return;
    await db.batch([
      db
        .update(promptGroup)
        .set({ sortOrder: neighbor.sortOrder })
        .where(eq(promptGroup.id, current.id)),
      db
        .update(promptGroup)
        .set({ sortOrder: current.sortOrder })
        .where(eq(promptGroup.id, neighbor.id)),
    ]);
  });

/** 表現をグループの中で1つ上または下へ動かす。端なら何もしない。 */
export const movePromptPhrase = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string(), direction: moveDirectionSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const [current] = await db.select().from(promptPhrase).where(eq(promptPhrase.id, data.id));
    if (!current) return;
    const up = data.direction === "up";
    const [neighbor] = await db
      .select()
      .from(promptPhrase)
      .where(
        and(
          eq(promptPhrase.groupId, current.groupId),
          up
            ? lt(promptPhrase.sortOrder, current.sortOrder)
            : gt(promptPhrase.sortOrder, current.sortOrder),
        ),
      )
      .orderBy(up ? desc(promptPhrase.sortOrder) : asc(promptPhrase.sortOrder))
      .limit(1);
    if (!neighbor) return;
    await db.batch([
      db
        .update(promptPhrase)
        .set({ sortOrder: neighbor.sortOrder })
        .where(eq(promptPhrase.id, current.id)),
      db
        .update(promptPhrase)
        .set({ sortOrder: current.sortOrder })
        .where(eq(promptPhrase.id, neighbor.id)),
    ]);
  });
