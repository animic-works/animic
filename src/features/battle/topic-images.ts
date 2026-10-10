import * as v from "valibot";

import { getAppImagePath } from "./image-src";

/** お題の画像として保存するWebPの上限。 */
export const maxTopicImageBytes = 5 * 1024 * 1024;

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

/**
 * このアプリが配信するお題の画像のURL（またはパス）なら、お題IDと画像IDを返す。
 * オリジンは見ない（`getAppImagePath`を参照）。
 */
export function parseTopicImageUrl(url: string) {
  const match = pathPattern.exec(getAppImagePath(url) ?? "");
  return readId(match?.[1], match?.[2]);
}

// 画像のデータを表すチャンクと、ブラウザーが書き出すWebPに入りうる付属のチャンク。
const imageChunks = new Set(["VP8 ", "VP8L"]);
const allowedChunks = new Set([...imageChunks, "VP8X", "ALPH", "ICCP"]);

function fourCc(bytes: Uint8Array, offset: number) {
  return String.fromCodePoint(...bytes.subarray(offset, offset + 4));
}

function uint32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

/**
 * お題の画像として保存できるWebPかを確かめる。
 * EXIF・XMPのメタデータ（NovelAIのプロンプトを含みうる）やアニメーションがあれば理由を返す。
 */
export function inspectTopicWebp(bytes: Uint8Array): string | null {
  if (bytes.byteLength > maxTopicImageBytes) return "画像が5MBを超えています。";
  if (bytes.byteLength < 20 || fourCc(bytes, 0) !== "RIFF" || fourCc(bytes, 8) !== "WEBP")
    return "WebPの画像ではありません。";
  if (uint32(bytes, 4) !== bytes.byteLength - 8) return "WebPの長さが正しくありません。";
  let offset = 12;
  let hasImage = false;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) return "WebPの形式が正しくありません。";
    const name = fourCc(bytes, offset);
    const size = uint32(bytes, offset + 4);
    const next = offset + 8 + size + (size % 2);
    if (next > bytes.byteLength) return "WebPの形式が正しくありません。";
    if (!allowedChunks.has(name))
      return name === "EXIF" || name === "XMP "
        ? "画像にメタデータが残っています。"
        : `WebPに対応していない内容（${name.trim()}）があります。`;
    if (imageChunks.has(name)) {
      if (hasImage) return "WebPに画像が2つ以上あります。";
      hasImage = true;
    }
    offset = next;
  }
  return hasImage ? null : "WebPに画像がありません。";
}
