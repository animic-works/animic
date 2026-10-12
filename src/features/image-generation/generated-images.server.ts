import { env } from "cloudflare:workers";
import * as v from "valibot";

import { getAppImagePath } from "../battle/image-src";

const contentType = "image/webp";
const idSchema = v.pipe(v.string(), v.uuid());
const pathPattern = /^\/generated-images\/([^/]+)\/([^/]+)$/;

type GeneratedImageId = { battleId: string; generationId: string };

function readId(battleId: unknown, generationId: unknown): GeneratedImageId | null {
  const battle = v.safeParse(idSchema, battleId);
  const generation = v.safeParse(idSchema, generationId);
  return battle.success && generation.success
    ? { battleId: battle.output, generationId: generation.output }
    : null;
}

// 別の対戦で同じ処理IDが使われても上書きしないよう、対戦IDを含める。
function imageKey({ battleId, generationId }: GeneratedImageId) {
  return `generations/${battleId}/${generationId}`;
}

/**
 * 生成キューのDOが返したWebPを保存し、配信URLを返す。
 * URLは対戦の状態と採点ジョブに記録するため、`BETTER_AUTH_URL`を基にした絶対URLにする。
 * 画面へは`toImageSrc`（`battle/image-src.ts`）で同じオリジンのパスにして渡す。
 */
export async function putGeneratedImage(id: GeneratedImageId, webp: Uint8Array) {
  await env.GENERATED_IMAGES.put(imageKey(id), webp, { httpMetadata: { contentType } });
  return new URL(`/generated-images/${id.battleId}/${id.generationId}`, env.BETTER_AUTH_URL).href;
}

/**
 * このアプリが配信する生成画像のURL（またはパス）なら、対戦IDと処理IDを返す。
 * オリジンは見ない（`getAppImagePath`を参照）。
 */
export function parseGeneratedImageUrl(url: string) {
  const match = pathPattern.exec(getAppImagePath(url) ?? "");
  return readId(match?.[1], match?.[2]);
}

export function readGeneratedImage(id: GeneratedImageId) {
  return env.GENERATED_IMAGES.get(imageKey(id));
}

/**
 * 生成画像を配信する。セッションは確かめない（URLは推測できないUUIDで、結果の確定前は本人にだけ配信する）。
 * 同じURLの画像は変わらないため、長くキャッシュさせる。
 */
export async function serveGeneratedImage(params: Record<string, string>) {
  const id = readId(params.battleId, params.generationId);
  const object = id ? await readGeneratedImage(id) : null;
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
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
