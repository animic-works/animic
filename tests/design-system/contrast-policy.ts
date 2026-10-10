// 現在の配色を維持する判断。適用範囲と見直し方針は docs/design.md を参照。
// Tokenの将来の値へ自動追従させず、承認済みの実際の色ペアだけを扱う。
const acceptedTextPairs = [
  ["#ffffff", "#ff2d87"], // primary操作・pink Avatar
  ["#ffffff", "#00b4fc"], // cyan Avatar
  ["#ffffff", "#ff72b9"], // rose Avatar
  ["#ffffff", "#16b37e"], // green Avatar
  ["#ffffff", "#ff7a45"], // orange Avatar
  ["#79828a", "#fafafb"], // 待機中の状態一覧（opacity 0.55）の名前・代替文字
  ["#9399a1", "#fafafb"], // 同じ待機状態の補足
] as const;

export function acceptsTextContrast(foreground: string, background: string) {
  return acceptedTextPairs.some(([fg, bg]) => fg === foreground && bg === background);
}
