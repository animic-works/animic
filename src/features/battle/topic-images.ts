import * as v from "valibot";

// IDはURLのパスとR2のキーにそのまま入れるため、記号を区切りに使えない文字に限る。
export const topicIdSchema = v.pipe(
  v.string(),
  v.regex(/^[A-Za-z0-9_-]{1,64}$/, "お題のIDに使えない文字があります。"),
);
const imageIdSchema = v.pipe(v.string(), v.uuid());
const keyPattern = /^topics\/([^/]+)\/([^/]+)$/;
const pathPattern = /^\/topic-images\/([^/]+)\/([^/]+)$/;

export type TopicImageId = { topicId: string; imageId: string };

function readId(topicId: unknown, imageId: unknown): TopicImageId | null {
  const topic = v.safeParse(topicIdSchema, topicId);
  const image = v.safeParse(imageIdSchema, imageId);
  return topic.success && image.success ? { topicId: topic.output, imageId: image.output } : null;
}

/** R2のキー。画像を差し替えるたびに画像IDを変え、配信URLも変える。 */
export function topicImageKey({ topicId, imageId }: TopicImageId) {
  return `topics/${topicId}/${imageId}`;
}

/** R2のキーからお題IDと画像IDを読む。形式が違えばnull。 */
export function parseTopicImageKey(key: string) {
  const match = keyPattern.exec(key);
  return readId(match?.[1], match?.[2]);
}

/** 配信のパス。同じオリジンから読むときに使う。 */
export function topicImagePath({ topicId, imageId }: TopicImageId) {
  return `/topic-images/${topicId}/${imageId}`;
}

/** 配信のパスの値（ルートの引数）を確かめる。 */
export function readTopicImageParams(params: Record<string, string>) {
  return readId(params.topicId, params.imageId);
}

/** このアプリが`base`のオリジンで配信するお題の画像のURLなら、お題IDと画像IDを返す。 */
export function parseTopicImageUrl(url: string, base: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.origin !== new URL(base).origin || parsed.search || parsed.hash) return null;
  const match = pathPattern.exec(parsed.pathname);
  return readId(match?.[1], match?.[2]);
}
