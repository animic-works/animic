import { describe, expect, it } from "vite-plus/test";

import {
  parseTopicImageKey,
  parseTopicImageUrl,
  topicImageKey,
  topicImagePath,
} from "./topic-images";

const imageId = "8d6f3c1e-2b4a-4c5d-9e8f-0a1b2c3d4e5f";

describe("お題の画像のキーとURL", () => {
  it("キーとパスを作り、読み戻せる", () => {
    const id = { topicId: "easy-001", imageId };
    expect(topicImageKey(id)).toBe(`topics/easy-001/${imageId}`);
    expect(parseTopicImageKey(topicImageKey(id))).toEqual(id);
    expect(topicImagePath(id)).toBe(`/topic-images/easy-001/${imageId}`);
  });

  it("形式の違うキーを読まない", () => {
    expect(parseTopicImageKey(`topics/easy-001/not-uuid`)).toBeNull();
    expect(parseTopicImageKey(`topics/../${imageId}`)).toBeNull();
    expect(parseTopicImageKey(`generations/easy-001/${imageId}`)).toBeNull();
  });

  it("配信のURLとパスを、オリジンによらずお題の画像として読む", () => {
    const base = "https://animic.party";
    const id = { topicId: "t1", imageId };
    expect(parseTopicImageUrl(`${base}/topic-images/t1/${imageId}`)).toEqual(id);
    // 別の公開URLで登録したお題も、同じR2の画像として読む。
    expect(parseTopicImageUrl(`http://localhost:3000/topic-images/t1/${imageId}`)).toEqual(id);
    expect(parseTopicImageUrl(`/topic-images/t1/${imageId}`)).toEqual(id);
    expect(parseTopicImageUrl(`${base}/topic-images/t1/${imageId}?x=1`)).toBeNull();
    expect(parseTopicImageUrl(`${base}/generated-images/t1/${imageId}`)).toBeNull();
    expect(parseTopicImageUrl(`${base}/og-image.png`)).toBeNull();
    expect(parseTopicImageUrl("not a url")).toBeNull();
  });
});
