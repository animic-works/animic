import * as v from "valibot";

/** プロンプトの文字数の上限（すべての欄を合わせた長さ）。 */
export const maxPromptLength = 1000;

/** 参加者が生成で指定できる入力。プロンプト以外はサーバーで固定する。 */
export const generationInputSchema = v.object({
  prompt: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("プロンプトを入力してください。"),
    v.maxLength(maxPromptLength, `プロンプトは${maxPromptLength}文字までです。`),
  ),
});
type GenerationInput = v.InferOutput<typeof generationInputSchema>;

/** 正規化した入力のSHA-256。同じ処理IDの再送が同じ内容かを、入力を保存せずに確かめる。 */
export async function getInputHash(input: GenerationInput) {
  const bytes = new TextEncoder().encode(JSON.stringify({ prompt: input.prompt }));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
