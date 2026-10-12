import { hasToken } from "./prompt-blocks";
import type { PromptBlocks, PromptMode } from "./prompt-blocks";
import type { PromptGroup, PromptPhrase } from "./prompt-phrases";

// 対戦画面の入力候補と検索で、表現の辞書（管理画面で編集し、D1から読む）を探す。

/** 検索・候補の1件。groupはジャンル（phrasesを除く） */
export type DictionaryHit = PromptPhrase & { group: Omit<PromptGroup, "phrases"> };

/** 入力方法に合わせた、欄に入れる言葉。サフィックスは入れない */
export const wordOf = (phrase: PromptPhrase, mode: PromptMode) =>
  mode === "tag" ? phrase.tag : phrase.label;

/** 欄（0はベース、1以降はキャラ）に入れるグループ。ベースにはベース・両方、キャラにはキャラ・両方を使う */
export function groupsForBlock(groups: readonly PromptGroup[], block: number): PromptGroup[] {
  const excluded = block === 0 ? "character" : "base";
  return groups.filter((group) => group.target !== excluded);
}

/** 画面に出す名前（表示名とサフィックス） */
export const phraseName = (phrase: PromptPhrase) => phrase.label + phrase.suffix;

/** カタカナをひらがなに、小文字・空白1つにそろえる（ゆるく探すため） */
export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/\s+/g, " ")
    .trim();
}

/** 強調する範囲（正規化した位置ではなく元の文字列の位置。見つからなければnull） */
export function matchRange(text: string, query: string): [number, number] | null {
  const q = normalizeQuery(query);
  if (!q) return null;
  // 1文字ずつ正規化して、正規化後の位置から元の文字列の位置へ戻す（空白の詰めや前後の空白で位置がずれるため）
  let normalized = "";
  const origin: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const char = normalizeQuery(text.charAt(index)) || " ";
    if (char === " " && (normalized === "" || normalized.endsWith(" "))) continue;
    normalized += char;
    origin.push(index);
  }
  const start = normalized.indexOf(q);
  if (start < 0) return null;
  const last = origin[start + q.length - 1];
  const first = origin[start];
  return first === undefined || last === undefined ? null : [first, last + 1];
}

const hitsOf = (groups: readonly PromptGroup[]): DictionaryHit[] =>
  groups.flatMap(({ phrases, ...group }) => phrases.map((phrase) => ({ ...phrase, group })));

const includes = (text: string, q: string) => normalizeQuery(text).includes(q);

/** 探す語（画面に出す名前・タグ・別名）のどれかが条件に合うか */
const someText = (hit: DictionaryHit, test: (text: string) => boolean) =>
  [phraseName(hit), hit.tag, ...hit.aliases].some((text) => test(normalizeQuery(text)));

/** 入力候補: 画面に出す名前・タグ・別名に含む表現を、前方一致を先にしてlimit件まで */
export function searchDictionary(
  groups: readonly PromptGroup[],
  query: string,
  limit = 8,
): DictionaryHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const starts = (hit: DictionaryHit) => someText(hit, (text) => text.startsWith(q));
  return hitsOf(groups)
    .filter((hit) => someText(hit, (text) => text.includes(q)))
    .toSorted((a, b) => Number(!starts(a)) - Number(!starts(b)))
    .slice(0, limit);
}

/** 検索の窓: 検索語があればジャンルをまたいで（ジャンル名・別名にも合わせて）探し、なければ選んだジャンル（nullはすべて）を並べる */
export function browseDictionary(
  groups: readonly PromptGroup[],
  genre: string | null,
  query: string,
): DictionaryHit[] {
  const q = normalizeQuery(query);
  if (!q) return hitsOf(genre ? groups.filter((group) => group.id === genre) : groups);
  return hitsOf(groups).filter(
    (hit) => someText(hit, (text) => text.includes(q)) || includes(hit.group.label, q),
  );
}

/**
 * 入力方法を切り替えたときに、辞書にある語句を切り替え先の表記にする（例：「1人の女の子」と「1girl」）。
 * 切り替え前の表記（大文字小文字を区別しない）が同じ表現の、最初の1件を使う。辞書にない語句と重みは変えない。
 * 置き換えで同じ語句が欄に2つになる場合は、前の語句だけを残す
 */
export function convertBlocks(
  blocks: PromptBlocks,
  groups: readonly PromptGroup[],
  from: PromptMode,
  to: PromptMode,
): PromptBlocks {
  if (from === to) return blocks;
  const words = new Map<string, string>();
  for (const phrase of hitsOf(groups)) {
    const key = wordOf(phrase, from).toLowerCase();
    if (!words.has(key)) words.set(key, wordOf(phrase, to));
  }
  return blocks.map((tokens) => {
    const next: PromptBlocks[number] = [];
    for (const token of tokens) {
      const text = words.get(token.text.toLowerCase()) ?? token.text;
      if (!hasToken(next, text)) next.push({ ...token, text });
    }
    return next;
  });
}
