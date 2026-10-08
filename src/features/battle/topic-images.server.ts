import { env } from "cloudflare:workers";

import {
  inspectTopicWebp,
  readTopicImageParams,
  topicImageKey,
  topicImagePath,
} from "./topic-images";
import type { TopicImageId } from "./topic-images";

const contentType = "image/webp";

/** 配信URL。対戦の状態と採点が絶対URLを使うため、`BETTER_AUTH_URL`を基にする。 */
export function topicImageUrl(id: TopicImageId) {
  return new URL(topicImagePath(id), env.BETTER_AUTH_URL).href;
}

/** WebPを確かめてR2へ保存する。保存できなければ理由を返す。 */
export async function putTopicImage(id: TopicImageId, bytes: Uint8Array) {
  const error = inspectTopicWebp(bytes);
  if (error) return error;
  await env.TOPIC_IMAGES.put(topicImageKey(id), bytes, { httpMetadata: { contentType } });
  return null;
}

export async function hasTopicImage(key: string) {
  return (await env.TOPIC_IMAGES.head(key)) !== null;
}

export function readTopicImage(id: TopicImageId) {
  return env.TOPIC_IMAGES.get(topicImageKey(id));
}

/**
 * お題の画像を配信する。セッションは確かめない（対戦で全員に見せる画像で、URLは推測できない）。
 * 差し替えるとURLが変わるため、長くキャッシュさせる。
 */
export async function serveTopicImage(params: Record<string, string>) {
  const id = readTopicImageParams(params);
  const object = id ? await readTopicImage(id) : null;
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
