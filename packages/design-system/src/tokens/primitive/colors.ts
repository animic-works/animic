import { defineTokens } from "@pandacss/dev";

// 用途を持たない色の段階。画面からは直接使わず、semantic/colors.ts から参照する。
// 値は画面モック（mock/css/common.css）の色を基準に、段階をそろえて作る
export const colors = defineTokens.colors({
  white: { value: "#ffffff" },
  black: { value: "#000000" },
  transparent: { value: "transparent" },
  current: { value: "currentColor" },
  // 文字と線の濃淡（紺寄りのグレー）
  neutral: {
    50: { value: "#f5f6f8" },
    100: { value: "#e6e8ec" },
    200: { value: "#dfe2e7" },
    // ログイン連携のボタンの縁（200より少し濃い）
    250: { value: "#c7cbd1" },
    300: { value: "#c9ced6" },
    // 「VS」や空のマスなど、薄い飾りの文字（本文には使わない）
    350: { value: "#b5bcc6" },
    400: { value: "#9aa3ae" },
    500: { value: "#7a838f" },
    600: { value: "#5b6573" },
    // トップの説明文（見出しの下の文章・手順の説明）
    700: { value: "#3b4654" },
    800: { value: "#1c2a39" },
    900: { value: "#0b1b2b" },
  },
  // ブランドのピンク。500がブランドの色。白い文字を載せる面は600以上にする（コントラスト4.5:1以上）
  pink: {
    50: { value: "#fff7fb" },
    100: { value: "#fff0f7" },
    // 帯や写真の地に使う、100より少し濃い淡いピンク
    150: { value: "#ffe4f1" },
    200: { value: "#ffd0e4" },
    300: { value: "#ffb8d6" },
    400: { value: "#ff72b9" },
    500: { value: "#ff2d87" },
    600: { value: "#e0146d" },
    700: { value: "#c4105f" },
    800: { value: "#a30d4f" },
  },
  // 取り消せない操作・エラー（ピンクと見分けられる赤）
  red: {
    50: { value: "#fdecec" },
    600: { value: "#d4145a" },
  },
  cyan: {
    50: { value: "#eaf8ff" },
    // カードや写真の地に使う淡い水色
    75: { value: "#e0f6ff" },
    100: { value: "#ccefff" },
    300: { value: "#6fd3ff" },
    500: { value: "#00b4fc" },
    700: { value: "#0083b8" },
  },
  yellow: {
    50: { value: "#fff8d6" },
    // カードや写真の地に使う淡い黄色
    75: { value: "#fff9d1" },
    100: { value: "#fff6cc" },
    300: { value: "#ffe98a" },
    500: { value: "#fddb13" },
    700: { value: "#a88f00" },
  },
  green: {
    50: { value: "#f1fbf6" },
    // ギャラリーの画像の地に使う淡い緑
    75: { value: "#e3f6ee" },
    100: { value: "#dcfce7" },
    // 準備OKの点など、小さな目印の緑
    400: { value: "#22c55e" },
    500: { value: "#16b37e" },
    700: { value: "#15803d" },
  },
  purple: {
    // ギャラリーの画像の地に使う淡い紫
    75: { value: "#efe9ff" },
    500: { value: "#7c5cff" },
  },
  orange: {
    500: { value: "#ff7a45" },
  },
  // ログイン連携先のブランドの色
  discord: {
    500: { value: "#5865f2" },
  },
});
