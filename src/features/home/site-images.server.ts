import { env } from "cloudflare:workers";
import { isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { inspectPng } from "../../lib/png";
import { inspectWebp } from "../../lib/webp";
import { ogImageSize, siteImageIdOf, siteImageIdSchema } from "./home-content";
import { galleryItem, homeItem, siteSetting } from "./home-content.schema";

/** R2の`delete`に一度に渡せるキーの数の上限。 */
const maxDeleteKeys = 1000;

const imageKey = (imageId: string) => `images/${imageId}`;

/**
 * 画像を確かめ、新しい画像IDでR2へ保存する。保存できれば画像ID、できなければ理由を返す。
 * 遊び方・採点方法・ギャラリーの画像はWebP、OGP画像は1200×630のPNG。
 */
export async function putSiteImage(
  kind: "webp" | "og",
  bytes: Uint8Array,
): Promise<{ imageId: string; error: null } | { imageId: null; error: string }> {
  const error = kind === "og" ? inspectPng(bytes, ogImageSize) : inspectWebp(bytes);
  if (error) return { imageId: null, error };
  const imageId = crypto.randomUUID();
  await env.SITE_IMAGES.put(imageKey(imageId), bytes, {
    httpMetadata: { contentType: kind === "og" ? "image/png" : "image/webp" },
  });
  return { imageId, error: null };
}

/**
 * 渡した画像（画像IDか`/site-images/`のパス）のうち、どこからも使われていないものをR2から消す。
 * 差し替え・削除の後に、前の画像を渡して呼ぶ。
 */
export async function deleteUnusedSiteImages(candidates: readonly (string | null)[]) {
  const ids = new Set(
    candidates.flatMap((value) => {
      const id = siteImageIdOf(value) ?? value;
      return id && v.is(siteImageIdSchema, id) ? [id] : [];
    }),
  );
  if (ids.size === 0) return;
  const db = drizzle(env.DB);
  const [items, gallery, settings] = await Promise.all([
    db.select({ imageId: homeItem.imageId }).from(homeItem).where(isNotNull(homeItem.imageId)),
    db.select({ topic: galleryItem.topicSrc, shot: galleryItem.shotSrc }).from(galleryItem),
    db.select({ value: siteSetting.value }).from(siteSetting),
  ]);
  for (const used of [
    ...items.map((item) => item.imageId),
    ...gallery.flatMap((item) => [siteImageIdOf(item.topic), siteImageIdOf(item.shot)]),
    ...settings.map((setting) => setting.value),
  ])
    if (used) ids.delete(used);
  const keys = [...ids].map(imageKey);
  for (let index = 0; index < keys.length; index += maxDeleteKeys)
    await env.SITE_IMAGES.delete(keys.slice(index, index + maxDeleteKeys));
}

/**
 * 登録した画像を配信する。トップページとSNSのOGPで誰にでも見せる画像のため、セッションは確かめない。
 * 差し替えるとURLが変わるため、長くキャッシュさせる。
 */
export async function serveSiteImage(params: Record<string, string>) {
  const id = v.safeParse(siteImageIdSchema, params.imageId);
  const object = id.success ? await env.SITE_IMAGES.get(imageKey(id.output)) : null;
  if (!object)
    return new Response("見つかりません。", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(object.size),
      ETag: object.httpEtag,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
