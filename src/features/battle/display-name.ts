/**
 * 表示名を、決まった文字数までに縮める。はみ出す分は「…」にする（全体の名前は`title`や読み上げ名で伝える）。
 * 文字数は書記素ではなくコードポイントで数える（表示名は20文字まで）。
 */
export function shortenName(name: string, max: number) {
  const chars = Array.from(name);
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : name;
}
