import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import { generationInputSchema, getInputHash, maxPromptLength } from "./generation-input";

describe("生成の入力", () => {
  it("前後の空白を除き、空のプロンプトと上限を超えるプロンプトを拒否する", () => {
    expect(v.parse(generationInputSchema, { prompt: "  笑顔、白背景 \n" })).toEqual({
      prompt: "笑顔、白背景",
    });
    expect(v.safeParse(generationInputSchema, { prompt: " \n " }).success).toBe(false);
    expect(
      v.safeParse(generationInputSchema, { prompt: "あ".repeat(maxPromptLength) }).success,
    ).toBe(true);
    expect(
      v.safeParse(generationInputSchema, { prompt: "あ".repeat(maxPromptLength + 1) }).success,
    ).toBe(false);
  });

  it("同じ入力から同じハッシュを作り、内容が違えば別のハッシュにする", async () => {
    const hash = await getInputHash({ prompt: "笑顔、白背景" });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await getInputHash({ prompt: "笑顔、白背景" })).toBe(hash);
    expect(await getInputHash(v.parse(generationInputSchema, { prompt: " 笑顔、白背景 " }))).toBe(
      hash,
    );
    expect(await getInputHash({ prompt: "笑顔、黒背景" })).not.toBe(hash);
  });
});
