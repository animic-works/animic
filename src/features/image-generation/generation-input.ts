import * as v from "valibot";

/** プロンプトの文字数の上限（すべての欄を合わせた長さ）。 */
export const maxPromptLength = 1000;
/** キャラのプロンプトの数の上限（むずかしいの2キャラクター）。 */
const maxCharacters = 2;

/**
 * 参加者が生成で指定できる入力。プロンプト以外はサーバーで固定する。
 * `prompt`はベースの欄（全体）、`characters`はキャラの欄ごとのプロンプト（空の欄は空文字列）。
 * 対戦の処理の入力にも合わせるため、検証は`checkGenerationInput`で別に行う。
 */
export const generationInputEntries = {
  prompt: v.pipe(v.string(), v.trim()),
  characters: v.optional(
    v.pipe(v.array(v.pipe(v.string(), v.trim())), v.maxLength(maxCharacters)),
    [],
  ),
};
export type GenerationInput = { prompt: string; characters: string[] };

/** すべての欄を合わせた文字数 */
export function promptLength(input: GenerationInput) {
  return input.characters.reduce((total, text) => total + text.length, input.prompt.length);
}

/** 送れない理由。送れるならnull */
function generationInputError(input: GenerationInput): string | null {
  const length = promptLength(input);
  if (length === 0) return "プロンプトを入力してください。";
  if (length > maxPromptLength) return `プロンプトは${maxPromptLength}文字までです。`;
  return null;
}

/** `generationInputEntries`を持つ入力の検証。すべての欄が空・文字数の上限を超えるときに失敗する */
export function checkGenerationInput<T extends GenerationInput>() {
  return v.rawCheck<T>(({ dataset, addIssue }) => {
    if (!dataset.typed) return;
    const message = generationInputError(dataset.value);
    if (message) addIssue({ message });
  });
}

export const generationInputSchema = v.pipe(
  v.object(generationInputEntries),
  checkGenerationInput(),
);

/** 正規化した入力のSHA-256。同じ処理IDの再送が同じ内容かを、入力を保存せずに確かめる。 */
export async function getInputHash(input: GenerationInput) {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ prompt: input.prompt, characters: input.characters }),
  );
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
