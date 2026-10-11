import * as v from "valibot";

import { phraseImageIdSchema, promptIdSchema } from "./prompt-phrases";

/** 挿絵として保存する画像の長い辺の上限（px）。検索のカードに小さく出すため、登録の前に縮める。 */
export const phraseImageMaxSide = 640;

export type PhraseImageId = { phraseId: string; imageId: string };

/** R2のキー。画像IDは差し替えるたびに変える。 */
export function phraseImageKey({ phraseId, imageId }: PhraseImageId) {
  return `phrases/${phraseId}/${imageId}`;
}

/** 配信のパス。 */
export function phraseImagePath({ phraseId, imageId }: PhraseImageId) {
  return `/phrase-images/${phraseId}/${imageId}`;
}

/** 配信のパスの値（ルートの引数）を確かめる。形式が違えばnull。 */
export function readPhraseImageParams(params: Record<string, string>): PhraseImageId | null {
  const phrase = v.safeParse(promptIdSchema, params.phraseId);
  const image = v.safeParse(phraseImageIdSchema, params.imageId);
  return phrase.success && image.success
    ? { phraseId: phrase.output, imageId: image.output }
    : null;
}
