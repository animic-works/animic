import { describe, expect, it } from "vite-plus/test";

import { phraseImageKey, phraseImagePath, readPhraseImageParams } from "./phrase-images";

const imageId = "8d6f3c1e-2b4a-4c5d-9e8f-0a1b2c3d4e5f";

describe("挿絵のキーとパス", () => {
  it("表現IDと画像IDから、R2のキーと配信のパスを作る", () => {
    const id = { phraseId: "hair-two-tone-hair", imageId };
    expect(phraseImageKey(id)).toBe(`phrases/hair-two-tone-hair/${imageId}`);
    expect(phraseImagePath(id)).toBe(`/phrase-images/hair-two-tone-hair/${imageId}`);
    expect(readPhraseImageParams({ phraseId: id.phraseId, imageId })).toEqual(id);
  });

  it("形式の違う配信のパスの値を読まない", () => {
    expect(readPhraseImageParams({ phraseId: "hair", imageId: "not-uuid" })).toBeNull();
    expect(readPhraseImageParams({ phraseId: "../hair", imageId })).toBeNull();
    expect(readPhraseImageParams({ imageId })).toBeNull();
  });
});
