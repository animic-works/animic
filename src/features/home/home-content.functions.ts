import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { asc, desc, eq, gt, lt, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import { moveDirectionSchema } from "../image-generation/prompt-phrases";
import {
  galleryItemTextSchema,
  homeItemIdSchema,
  homeItemTextSchema,
  siteImagePath,
} from "./home-content";
import { galleryItem, homeItem, siteSetting } from "./home-content.schema";
import { loadHomeContent, loadOgImage, ogImageKey } from "./home-content.server";
import { deleteUnusedSiteImages, putSiteImage } from "./site-images.server";

/** トップページに出す内容。誰にでも見せる情報のため認証しない。 */
export const getHomeContent = createServerFn({ method: "GET" }).handler(() =>
  loadHomeContent(env.DB),
);

/** SNSが認証なしで取得できる共通のOGP画像。 */
export const getOgImage = createServerFn({ method: "GET" }).handler(async () => ({
  ogImage: await loadOgImage(env.DB),
}));

/** 値（JSON）と画像のファイルを1つのフォームで受け取る。 */
function readContentForm(form: unknown) {
  if (!(form instanceof FormData)) throw new Error("フォームの形式が正しくありません。");
  const data = form.get("data");
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : null;
  const file = (name: string) => {
    const value = form.get(name);
    return value instanceof File ? value : null;
  };
  return {
    data: parsed,
    image: file("image"),
    topic: file("topic"),
    shot: file("shot"),
  };
}

async function saveImage(kind: "webp" | "og", file: File | null) {
  if (!file) return { imageId: null, error: null };
  return putSiteImage(kind, new Uint8Array(await file.arrayBuffer()));
}

const homeItemFormSchema = v.object({
  id: homeItemIdSchema,
  ...homeItemTextSchema.entries,
  removeImage: v.optional(v.boolean(), false),
});

/** 遊び方・採点方法の項目の題名・本文を保存し、画像を登録・差し替え・取り外す。 */
export const saveHomeItem = createServerFn({ method: "POST" })
  .validator(readContentForm)
  .handler(async ({ data: form }) => {
    requireAdmin();
    const parsed = v.safeParse(homeItemFormSchema, form.data);
    if (!parsed.success) return { error: parsed.issues[0].message };
    const { id, title, description, removeImage } = parsed.output;
    const image = await saveImage("webp", form.image);
    if (image.error) return { error: image.error };
    const db = drizzle(env.DB);
    const [current] = await db.select().from(homeItem).where(eq(homeItem.id, id));
    const imageId = image.imageId ?? (removeImage ? null : (current?.imageId ?? null));
    await db
      .insert(homeItem)
      .values({ id, title, description, imageId })
      .onConflictDoUpdate({ target: homeItem.id, set: { title, description, imageId } });
    await deleteUnusedSiteImages([current?.imageId ?? null]);
    return { error: null };
  });

const galleryIdSchema = v.pipe(
  v.string(),
  v.regex(/^[A-Za-z0-9_-]{1,64}$/, "IDに使えない文字があります。"),
);

/**
 * ギャラリーの例を追加（最後に並べる）・変更する。追加ではお題と提出の画像が要り、変更では選んだ画像だけ差し替える。
 */
export const saveGalleryItem = createServerFn({ method: "POST" })
  .validator(readContentForm)
  .handler(async ({ data: form }) => {
    requireAdmin();
    const parsed = v.safeParse(
      v.object({ id: galleryIdSchema, ...galleryItemTextSchema.entries }),
      form.data,
    );
    if (!parsed.success) return { error: parsed.issues[0].message };
    const { id, metrics, ...text } = parsed.output;
    const db = drizzle(env.DB);
    const [current] = await db.select().from(galleryItem).where(eq(galleryItem.id, id));
    if (!current && (!form.topic || !form.shot))
      return { error: "お題と提出の画像を選んでください。" };
    const topic = await saveImage("webp", form.topic);
    if (topic.error) return { error: topic.error };
    const shot = await saveImage("webp", form.shot);
    if (shot.error) {
      await deleteUnusedSiteImages([topic.imageId]);
      return { error: shot.error };
    }
    const values = {
      ...text,
      ...metrics,
      topicSrc: topic.imageId ? siteImagePath(topic.imageId) : (current?.topicSrc ?? ""),
      shotSrc: shot.imageId ? siteImagePath(shot.imageId) : (current?.shotSrc ?? ""),
    };
    if (current) await db.update(galleryItem).set(values).where(eq(galleryItem.id, id));
    else {
      const [last] = await db.select({ value: max(galleryItem.sortOrder) }).from(galleryItem);
      await db.insert(galleryItem).values({ id, ...values, sortOrder: (last?.value ?? -1) + 1 });
    }
    await deleteUnusedSiteImages([current?.topicSrc ?? null, current?.shotSrc ?? null]);
    return { error: null };
  });

/** ギャラリーの例を削除する。登録した画像も消える。 */
export const deleteGalleryItem = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const [current] = await db
      .delete(galleryItem)
      .where(eq(galleryItem.id, data.id))
      .returning({ topic: galleryItem.topicSrc, shot: galleryItem.shotSrc });
    if (current) await deleteUnusedSiteImages([current.topic, current.shot]);
  });

/** ギャラリーの例を1つ前または後ろへ動かす（隣と並び順を入れ替える）。端なら何もしない。 */
export const moveGalleryItem = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string(), direction: moveDirectionSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const [current] = await db.select().from(galleryItem).where(eq(galleryItem.id, data.id));
    if (!current) return;
    const up = data.direction === "up";
    const [neighbor] = await db
      .select()
      .from(galleryItem)
      .where(
        up
          ? lt(galleryItem.sortOrder, current.sortOrder)
          : gt(galleryItem.sortOrder, current.sortOrder),
      )
      .orderBy(up ? desc(galleryItem.sortOrder) : asc(galleryItem.sortOrder))
      .limit(1);
    if (!neighbor) return;
    await db.batch([
      db
        .update(galleryItem)
        .set({ sortOrder: neighbor.sortOrder })
        .where(eq(galleryItem.id, current.id)),
      db
        .update(galleryItem)
        .set({ sortOrder: current.sortOrder })
        .where(eq(galleryItem.id, neighbor.id)),
    ]);
  });

/** OGP画像（1200×630のPNG）を登録・差し替える。 */
export const saveOgImage = createServerFn({ method: "POST" })
  .validator(readContentForm)
  .handler(async ({ data: form }) => {
    requireAdmin();
    if (!form.image) return { error: "画像を選んでください。" };
    const image = await saveImage("og", form.image);
    if (image.error || !image.imageId) return { error: image.error ?? "画像を保存できません。" };
    const db = drizzle(env.DB);
    const [current] = await db.select().from(siteSetting).where(eq(siteSetting.key, ogImageKey));
    await db
      .insert(siteSetting)
      .values({ key: ogImageKey, value: image.imageId })
      .onConflictDoUpdate({ target: siteSetting.key, set: { value: image.imageId } });
    await deleteUnusedSiteImages([current?.value ?? null]);
    return { error: null };
  });

/** 登録したOGP画像を外し、`public/og-image.png`に戻す。 */
export const deleteOgImage = createServerFn({ method: "POST" }).handler(async () => {
  requireAdmin();
  const db = drizzle(env.DB);
  const [current] = await db
    .delete(siteSetting)
    .where(eq(siteSetting.key, ogImageKey))
    .returning({ value: siteSetting.value });
  await deleteUnusedSiteImages([current?.value ?? null]);
});
