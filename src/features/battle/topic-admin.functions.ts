import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { asc, count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import { difficultySchema } from "./battle-state";
import { topic } from "./battle.schema";
import { topicFieldsSchema, topicStatusSchema } from "./topic-admin";
import { putTopicImage, topicImageUrl } from "./topic-images.server";
import { maxTopicImageBytes, topicIdSchema, topicImageKey } from "./topic-images";

function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function readForm(form: unknown) {
  if (!(form instanceof FormData)) throw new Error("フォームの形式が正しくありません。");
  const file = form.get("file");
  return { form, file: file instanceof File ? file : null };
}

async function saveImage(topicId: string, file: File | null) {
  if (!file) return { error: "画像を選んでください。" } as const;
  if (file.size > maxTopicImageBytes) return { error: "画像が5MBを超えています。" } as const;
  const imageId = crypto.randomUUID();
  const error = await putTopicImage({ topicId, imageId }, new Uint8Array(await file.arrayBuffer()));
  if (error) return { error } as const;
  const id = { topicId, imageId };
  return { error: null, imageKey: topicImageKey(id), imageUrl: topicImageUrl(id) } as const;
}

/** お題の一覧（更新日時の新しい順）と、難易度ごとの公開中の数。 */
export const listAdminTopics = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = drizzle(env.DB);
  const [topics, published] = await Promise.all([
    db.select().from(topic).orderBy(desc(topic.updatedAt), asc(topic.id)),
    db
      .select({ difficulty: topic.difficulty, count: count() })
      .from(topic)
      .where(eq(topic.status, "published"))
      .groupBy(topic.difficulty),
  ]);
  const publishedByDifficulty = { easy: 0, normal: 0, hard: 0 };
  for (const row of published) publishedByDifficulty[row.difficulty] = row.count;
  return { topics, publishedByDifficulty };
});

export const getAdminTopic = createServerFn({ method: "GET" })
  .validator(v.object({ id: v.string() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const [found] = await drizzle(env.DB).select().from(topic).where(eq(topic.id, data.id));
    return found ?? null;
  });

/**
 * 画像からお題を非公開で追加する。画像はブラウザーで変換したWebPを受け取る。
 * 同じIDの再送では追加し直さず、作成済みのお題を返す。
 */
export const createTopic = createServerFn({ method: "POST" })
  .validator(readForm)
  .handler(async ({ data: { form, file } }) => {
    requireAdmin();
    const fields = v.parse(
      v.object({ id: v.pipe(v.string(), v.uuid()), difficulty: difficultySchema }),
      { id: formText(form, "id"), difficulty: formText(form, "difficulty") },
    );
    const db = drizzle(env.DB);
    const [existing] = await db.select({ id: topic.id }).from(topic).where(eq(topic.id, fields.id));
    if (existing) return { id: existing.id, error: null };
    const image = await saveImage(fields.id, file);
    if (image.error !== null) return { id: null, error: image.error };
    const now = Date.now();
    await db.insert(topic).values({
      id: fields.id,
      difficulty: fields.difficulty,
      imageKey: image.imageKey,
      imageUrl: image.imageUrl,
      title: "",
      note: "",
      status: "unpublished",
      createdAt: now,
      updatedAt: now,
    });
    return { id: fields.id, error: null };
  });

export const updateTopic = createServerFn({ method: "POST" })
  .validator(topicFieldsSchema)
  .handler(async ({ data }) => {
    requireAdmin();
    const updated = await drizzle(env.DB)
      .update(topic)
      .set({
        difficulty: data.difficulty,
        title: data.title,
        note: data.note,
        updatedAt: Date.now(),
      })
      .where(eq(topic.id, data.id))
      .returning({ id: topic.id });
    return { error: updated.length ? null : "お題が見つかりません。" };
  });

/** 画像を新しいURLで差し替える。古い画像は、過去の対戦結果が参照しうるため消さない。 */
export const replaceTopicImage = createServerFn({ method: "POST" })
  .validator(readForm)
  .handler(async ({ data: { form, file } }) => {
    requireAdmin();
    const id = v.parse(topicIdSchema, formText(form, "id"));
    const db = drizzle(env.DB);
    const [existing] = await db.select({ id: topic.id }).from(topic).where(eq(topic.id, id));
    if (!existing) return { error: "お題が見つかりません。" };
    const image = await saveImage(id, file);
    if (image.error !== null) return { error: image.error };
    await db
      .update(topic)
      .set({ imageKey: image.imageKey, imageUrl: image.imageUrl, updatedAt: Date.now() })
      .where(eq(topic.id, id));
    return { error: null };
  });

export const setTopicStatus = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string(), status: topicStatusSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    const updated = await drizzle(env.DB)
      .update(topic)
      .set({ status: data.status, updatedAt: Date.now() })
      .where(eq(topic.id, data.id))
      .returning({ id: topic.id });
    return { error: updated.length ? null : "お題が見つかりません。" };
  });

/** お題を削除する。進行中の対戦と保存済みの結果は、対戦開始時に写したお題を使うため変わらない。 */
export const deleteTopic = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string() }))
  .handler(async ({ data }) => {
    requireAdmin();
    await drizzle(env.DB).delete(topic).where(eq(topic.id, data.id));
  });
