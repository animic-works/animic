import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import { getAppImagePath, imageSrcSchema, toImageSrc } from "./image-src";

const id = "3f2b4c1e-8a7d-4e6f-9b0a-1c2d3e4f5a6b";

describe("画面に渡す画像のURL", () => {
  it("このアプリが配信する画像は、オリジンによらずパスにする", () => {
    expect(toImageSrc(`http://localhost:3000/topic-images/t1/${id}`)).toBe(
      `/topic-images/t1/${id}`,
    );
    expect(toImageSrc(`https://animic.party/generated-images/b1/${id}`)).toBe(
      `/generated-images/b1/${id}`,
    );
    expect(toImageSrc(`/topic-images/t1/${id}`)).toBe(`/topic-images/t1/${id}`);
  });

  it("ほかの画像のURLは変えない", () => {
    expect(toImageSrc("https://example.invalid/topic.png")).toBe(
      "https://example.invalid/topic.png",
    );
    expect(toImageSrc(`https://animic.party/topic-images/t1/${id}?x=1`)).toBe(
      `https://animic.party/topic-images/t1/${id}?x=1`,
    );
    expect(getAppImagePath("http://localhost:3000/images/topic.webp")).toBeNull();
    expect(getAppImagePath("not a url")).toBeNull();
  });

  it("絶対URLと、このアプリが配信する画像のパスを受け付ける", () => {
    expect(v.is(imageSrcSchema, `/generated-images/b1/${id}`)).toBe(true);
    expect(v.is(imageSrcSchema, "https://example.invalid/a.png")).toBe(true);
    expect(v.is(imageSrcSchema, "/images/a.png")).toBe(false);
  });
});
