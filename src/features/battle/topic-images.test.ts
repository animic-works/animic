import { describe, expect, it } from "vite-plus/test";

import {
  inspectTopicWebp,
  maxTopicImageBytes,
  parseTopicImageKey,
  parseTopicImageUrl,
  topicImageKey,
  topicImagePath,
} from "./topic-images";

const imageId = "8d6f3c1e-2b4a-4c5d-9e8f-0a1b2c3d4e5f";

function chunk(name: string, size: number) {
  const bytes = new Uint8Array(8 + size + (size % 2));
  bytes.set(Array.from(name, (char) => char.charCodeAt(0)));
  new DataView(bytes.buffer).setUint32(4, size, true);
  return bytes;
}

function webp(...chunks: Uint8Array[]) {
  const body = chunks.reduce((sum, item) => sum + item.byteLength, 0);
  const bytes = new Uint8Array(12 + body);
  bytes.set(Array.from("RIFF", (char) => char.charCodeAt(0)));
  new DataView(bytes.buffer).setUint32(4, 4 + body, true);
  bytes.set(
    Array.from("WEBP", (char) => char.charCodeAt(0)),
    8,
  );
  let offset = 12;
  for (const item of chunks) {
    bytes.set(item, offset);
    offset += item.byteLength;
  }
  return bytes;
}

describe("inspectTopicWebp", () => {
  it("画像のチャンクだけのWebPを受け付ける", () => {
    expect(inspectTopicWebp(webp(chunk("VP8 ", 10)))).toBeNull();
    expect(
      inspectTopicWebp(webp(chunk("VP8X", 10), chunk("ALPH", 3), chunk("VP8 ", 9))),
    ).toBeNull();
  });

  it("EXIF・XMPのメタデータとアニメーションを拒否する", () => {
    expect(inspectTopicWebp(webp(chunk("VP8X", 10), chunk("VP8 ", 10), chunk("EXIF", 4)))).toBe(
      "画像にメタデータが残っています。",
    );
    expect(inspectTopicWebp(webp(chunk("VP8X", 10), chunk("XMP ", 4), chunk("VP8L", 4)))).toBe(
      "画像にメタデータが残っています。",
    );
    expect(inspectTopicWebp(webp(chunk("VP8X", 10), chunk("ANIM", 6), chunk("ANMF", 16)))).toBe(
      "WebPに対応していない内容（ANIM）があります。",
    );
  });

  it("WebPでない・壊れた・大きすぎるデータを拒否する", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47]);
    expect(inspectTopicWebp(png)).toBe("WebPの画像ではありません。");
    const truncated = webp(chunk("VP8 ", 10)).subarray(0, 25);
    expect(inspectTopicWebp(truncated)).toBe("WebPの長さが正しくありません。");
    const overrun = webp(chunk("VP8 ", 10));
    new DataView(overrun.buffer).setUint32(16, 100, true);
    expect(inspectTopicWebp(overrun)).toBe("WebPの形式が正しくありません。");
    expect(inspectTopicWebp(webp(chunk("VP8X", 10)))).toBe("WebPに画像がありません。");
    expect(inspectTopicWebp(webp(chunk("VP8 ", maxTopicImageBytes)))).toBe(
      "画像が5MBを超えています。",
    );
  });
});

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

  it("同じオリジンの配信URLだけをお題の画像として読む", () => {
    const base = "https://animic.party";
    expect(parseTopicImageUrl(`${base}/topic-images/t1/${imageId}`, base)).toEqual({
      topicId: "t1",
      imageId,
    });
    expect(parseTopicImageUrl(`https://example.com/topic-images/t1/${imageId}`, base)).toBeNull();
    expect(parseTopicImageUrl(`${base}/topic-images/t1/${imageId}?x=1`, base)).toBeNull();
    expect(parseTopicImageUrl(`${base}/og-image.png`, base)).toBeNull();
    expect(parseTopicImageUrl("not a url", base)).toBeNull();
  });
});
