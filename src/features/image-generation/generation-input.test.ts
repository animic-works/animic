import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import { generationInputSchema, getInputHash, maxPromptLength } from "./generation-input";

const ok = (input: unknown) => v.safeParse(generationInputSchema, input).success;

describe("生成の入力", () => {
  it("前後の空白を除き、キャラのプロンプトがなければ空の並びにする", () => {
    expect(
      v.parse(generationInputSchema, { prompt: "  白背景 \n", characters: [" 笑顔 ", ""] }),
    ).toEqual({ prompt: "白背景", characters: ["笑顔", ""] });
    expect(v.parse(generationInputSchema, { prompt: "白背景" })).toEqual({
      prompt: "白背景",
      characters: [],
    });
  });

  it("すべての欄が空、合わせて上限を超える、キャラが3つ以上の入力を拒否する", () => {
    expect(ok({ prompt: " \n ", characters: ["", " "] })).toBe(false);
    expect(ok({ prompt: "", characters: ["笑顔"] })).toBe(true);
    const half = "あ".repeat(maxPromptLength / 2);
    expect(ok({ prompt: half, characters: [half] })).toBe(true);
    expect(ok({ prompt: half, characters: [`${half}あ`] })).toBe(false);
    expect(ok({ prompt: "", characters: ["a", "b", "c"] })).toBe(false);
  });

  it("同じ入力から同じハッシュを作り、内容や欄が違えば別のハッシュにする", async () => {
    const input = { prompt: "白背景", characters: ["笑顔"] };
    const hash = await getInputHash(input);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await getInputHash({ ...input })).toBe(hash);
    expect(
      await getInputHash(
        v.parse(generationInputSchema, { prompt: " 白背景 ", characters: ["笑顔 "] }),
      ),
    ).toBe(hash);
    expect(await getInputHash({ prompt: "白背景", characters: ["泣き顔"] })).not.toBe(hash);
    expect(await getInputHash({ prompt: "白背景、笑顔", characters: [] })).not.toBe(hash);
  });
});
