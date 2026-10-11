import { env } from "cloudflare:workers";
import { isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { inspectWebp } from "../../lib/webp";
import { phraseImageKey, readPhraseImageParams } from "./phrase-images";
import type { PhraseImageId } from "./phrase-images";
import { promptPhrase } from "./prompt-phrases.schema";

const contentType = "image/webp";

/** R2の`delete`に一度に渡せるキーの数の上限。 */
const maxDeleteKeys = 1000;

/** WebPを確かめてR2へ保存する。保存できなければ理由を返す。 */
export async function putPhraseImage(id: PhraseImageId, bytes: Uint8Array) {
  const error = inspectWebp(bytes);
  if (error) return error;
  await env.PHRASE_IMAGES.put(phraseImageKey(id), bytes, { httpMetadata: { contentType } });
  return null;
}

export async function hasPhraseImage(id: PhraseImageId) {
  return (await env.PHRASE_IMAGES.head(phraseImageKey(id))) !== null;
}

/**
 * 渡した挿絵のうち、どの表現も使っていないものをR2から消す（`imageId`がnullのものは無視する）。
 * 差し替え・削除の後に、前の挿絵を渡して呼ぶ。
 */
export async function deleteUnusedPhraseImages(
  candidates: readonly { phraseId: string; imageId: string | null }[],
) {
  const images = candidates.flatMap(({ phraseId, imageId }) =>
    imageId ? [{ phraseId, imageId }] : [],
  );
  if (images.length === 0) return;
  const used = await drizzle(env.DB)
    .select({ phraseId: promptPhrase.id, imageId: promptPhrase.imageId })
    .from(promptPhrase)
    .where(isNotNull(promptPhrase.imageId));
  const usedKeys = new Set(
    used.flatMap(({ phraseId, imageId }) =>
      imageId ? [phraseImageKey({ phraseId, imageId })] : [],
    ),
  );
  const keys = [...new Set(images.map(phraseImageKey))].filter((key) => !usedKeys.has(key));
  for (let index = 0; index < keys.length; index += maxDeleteKeys)
    await env.PHRASE_IMAGES.delete(keys.slice(index, index + maxDeleteKeys));
}

/**
 * 挿絵を配信する。セッションは確かめない（対戦画面の検索で全員に見せる画像で、URLは推測できない）。
 * 差し替えるとURLが変わるため、長くキャッシュさせる。
 */
export async function servePhraseImage(params: Record<string, string>) {
  const id = readPhraseImageParams(params);
  const object = id ? await env.PHRASE_IMAGES.get(phraseImageKey(id)) : null;
  if (!object)
    return new Response("見つかりません。", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(object.size),
      ETag: object.httpEtag,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
