import { describe, expect, it } from "vite-plus/test";

import { shortenName } from "./display-name";

describe("表示名の省略", () => {
  it("決まった文字数を超える名前だけを「…」で縮める", () => {
    expect(shortenName("ぴよ丸", 7)).toBe("ぴよ丸");
    expect(shortenName("あいうえおかき", 7)).toBe("あいうえおかき");
    expect(shortenName("あいうえおかきく", 7)).toBe("あいうえおか…");
  });
});
