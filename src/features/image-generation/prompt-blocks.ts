// 対戦画面のプロンプト入力の操作（語句の確定・出し入れ・重み・組み立て）。
// 画面の状態は持たず、渡された語句の並びから次の並びを返す純粋な関数だけを置く

/** 入力方法。文章は日本語の表記、タグはDanbooruのタグで語句を入れる */
export type PromptMode = "text" | "tag";
/** 1つの語句。weightは0.1〜2.0（0.1刻み）、既定は1 */
export type PromptToken = { text: string; weight: number };
/** 欄の並び。[0]がベース、[1]以降がキャラ */
export type PromptBlocks = PromptToken[][];

export const MIN_WEIGHT = 0.1;
export const MAX_WEIGHT = 2;
/** 組み立てたプロンプトの文字数の上限（画面側だけで判定する） */
const MAX_PROMPT_LENGTH = 1000;

const SEPARATORS = /[、,，]/;

/** 入力を`、` `,` `，`で分け、前後の空白と空の部分を除く */
export function splitParts(value: string): string[] {
  return value
    .split(SEPARATORS)
    .map((part) => part.trim())
    .filter(Boolean);
}

const sameText = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** 欄にその語句があるか（大文字小文字を区別しない） */
export function hasToken(tokens: readonly PromptToken[], text: string): boolean {
  return tokens.some((token) => sameText(token.text, text));
}

// 同じ語句（大文字小文字を区別しない）は足さず、足した語句の重みは1にする
function appendWords(tokens: readonly PromptToken[], words: readonly string[]): PromptToken[] {
  const next = [...tokens];
  for (const text of words) if (!hasToken(next, text)) next.push({ text, weight: 1 });
  return next;
}

function lastSeparatorIndex(value: string) {
  return Math.max(value.lastIndexOf("、"), value.lastIndexOf(","), value.lastIndexOf("，"));
}

/**
 * 書きかけを語句にする。allでなければ最後の区切りより前だけを確定し、後ろ（先頭の空白を除く）を書きかけに残す。
 * 同じ語句は足さない。足した語句の重みは1
 */
export function commitDraft(
  tokens: readonly PromptToken[],
  draft: string,
  all = false,
): { tokens: PromptToken[]; draft: string } {
  const cut = lastSeparatorIndex(draft);
  const done = all ? draft : cut >= 0 ? draft.slice(0, cut) : "";
  const rest = all ? "" : cut >= 0 ? draft.slice(cut + 1) : draft;
  return { tokens: appendWords(tokens, splitParts(done)), draft: rest.trimStart() };
}

/** 入力候補を探す言葉（最後の区切りより後ろ） */
export function draftQuery(draft: string): string {
  return draft.slice(lastSeparatorIndex(draft) + 1);
}

/** 候補を採用する。最後の区切りより前を確定し、後ろを候補の言葉に置き換える。書きかけは空になる */
export function pickSuggestion(
  tokens: readonly PromptToken[],
  draft: string,
  word: string,
): { tokens: PromptToken[]; draft: string } {
  const committed = commitDraft(tokens, draft.slice(0, lastSeparatorIndex(draft) + 1), true);
  return { tokens: appendWords(committed.tokens, [word]), draft: "" };
}

/** 表現を出し入れする。あれば外し、なければ重み1で足す */
export function togglePhrase(tokens: readonly PromptToken[], word: string): PromptToken[] {
  return hasToken(tokens, word)
    ? tokens.filter((token) => !sameText(token.text, word))
    : [...tokens, { text: word, weight: 1 }];
}

/** indexの語句を欄から外し、書き直しの文字列にする（重みは戻らない） */
export function takeToken(
  tokens: readonly PromptToken[],
  index: number,
): { tokens: PromptToken[]; draft: string } {
  const token = tokens[index];
  if (!token) return { tokens: [...tokens], draft: "" };
  return { tokens: tokens.filter((_, i) => i !== index), draft: token.text };
}

/** 重みを0.1ずつ上げ下げする（0.1〜2.0、小数の誤差を丸める） */
export function stepWeight(
  tokens: readonly PromptToken[],
  index: number,
  direction: 1 | -1,
): PromptToken[] {
  return tokens.map((token, i) =>
    i === index
      ? {
          ...token,
          weight: Math.min(
            MAX_WEIGHT,
            Math.max(MIN_WEIGHT, Math.round((token.weight + direction * 0.1) * 10) / 10),
          ),
        }
      : token,
  );
}

/** すべての欄の語句の数 */
export function countTokens(blocks: readonly (readonly PromptToken[])[]): number {
  return blocks.reduce((total, block) => total + block.length, 0);
}

/** 欄のラベル。0はベース、キャラは上限が2なら番号付き */
export function blockLabel(index: number, maxCharacters: 1 | 2): string {
  if (index === 0) return "ベース";
  return maxCharacters > 1 ? `キャラ${index}` : "キャラ";
}

/** NovelAIの数値強調。重み1はそのまま、それ以外は`1.2::語句::` */
export function renderToken(token: PromptToken): string {
  return token.weight === 1 ? token.text : `${token.weight.toFixed(1)}::${token.text}::`;
}

/** 全欄をつないだ1つのプロンプト。空の欄は飛ばし、文章は`、`、タグは`, `でつなぐ */
export function assemblePrompt(
  blocks: readonly (readonly PromptToken[])[],
  mode: PromptMode,
): string {
  return blocks
    .flat()
    .map(renderToken)
    .join(mode === "tag" ? ", " : "、");
}

/** 書きかけを確定したと仮定した欄の並び（押せるかどうかの判定に使う） */
export function previewBlocks(blocks: PromptBlocks, active: number, draft: string): PromptBlocks {
  const current = blocks[active];
  if (!current || !draft.trim()) return blocks;
  const committed = commitDraft(current, draft, true).tokens;
  return blocks.map((block, index) => (index === active ? committed : block));
}

/** 「生成する」を押せない理由。nullなら押せる */
export function getGenerateBlocker(input: {
  /** 生成の関数が渡されているか */
  available: boolean;
  /** 受付終了・提出済み（理由は出さない） */
  locked: boolean;
  /** 自分の生成が未完了 */
  pending: boolean;
  prompt: string;
}): { disabled: true; reason: string | null } | { disabled: false; reason: null } {
  if (!input.available) return { disabled: true, reason: "画像の生成は準備中です" };
  if (input.locked) return { disabled: true, reason: null };
  if (input.pending) return { disabled: true, reason: "生成が終わるまでお待ちください" };
  if (!input.prompt) return { disabled: true, reason: "プロンプトを入力してください" };
  if (input.prompt.length > MAX_PROMPT_LENGTH) {
    return {
      disabled: true,
      reason: `プロンプトが${MAX_PROMPT_LENGTH}文字を超えています（${input.prompt.length}文字）`,
    };
  }
  return { disabled: false, reason: null };
}
