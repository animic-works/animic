import { defineSemanticTokens } from "@pandacss/dev";

// 画面で使う色。用途の名前で選び、具体的な色（pink.500など）は直接使わない
export const colors = defineSemanticTokens.colors({
  bg: {
    // ページの地。方眼の背景を敷く
    canvas: { value: "{colors.neutral.50}" },
    // カード・パネル
    surface: { value: "{colors.white}" },
    // ダイアログ・メニューなど、さらに手前に出るもの
    elevated: { value: "{colors.white}" },
    // くぼんだ面（入力の補足・タグの地・統計のタイル）
    sunken: { value: "{colors.neutral.50}" },
    // 黒地（順位のまとめ・シェアのボタン）
    inverse: { value: "{colors.neutral.900}" },
    // ダイアログの後ろの暗幕
    backdrop: { value: "rgb(11 27 43 / 0.45)" },
    // カウントダウン・提出待ちなど、画面全体を覆う暗幕（白い文字を載せる）
    scrim: { value: "rgb(11 27 43 / 0.85)" },
    // 上部のバーの半透明の地（方眼が透ける）
    translucent: { value: "rgb(245 246 248 / 0.9)" },
    // フッターの半透明の白
    translucentSurface: { value: "rgb(255 255 255 / 0.7)" },
  },
  fg: {
    default: { value: "{colors.neutral.900}" },
    muted: { value: "{colors.neutral.600}" },
    // トップの見出しの下の説明文・手順の説明（mutedより少し濃い）
    description: { value: "{colors.neutral.700}" },
    // 押せない状態・入力欄の例文・飾りだけに使う（本文にはコントラストが足りない）
    subtle: { value: "{colors.neutral.400}" },
    // 「VS」や空のマスなど、読ませない飾りの文字
    faint: { value: "{colors.neutral.350}" },
    inverse: { value: "{colors.white}" },
  },
  border: {
    default: { value: "{colors.neutral.200}" },
    // ログイン連携のボタン（Google）の細い縁
    provider: { value: "{colors.neutral.250}" },
    subtle: { value: "{colors.neutral.100}" },
    strong: { value: "{colors.neutral.900}" },
  },
  // 方眼の線
  grid: {
    line: { value: "{colors.neutral.100}" },
  },
  // 主な操作とブランドの色（ピンク）。モックと同じ色で、白い文字を載せてもコントラストAAは満たさない（docs/design.md）
  accent: {
    default: { value: "{colors.pink.500}" },
    // ブランドの色そのもの（defaultと同じ）。飾り・大きな面にも使う
    brand: { value: "{colors.pink.500}" },
    // 押せないときの淡いピンク（半透明にせず、後ろが透けないようにする）
    disabled: { value: "{colors.pink.300}" },
    subtle: { value: "{colors.pink.100}" },
    muted: { value: "{colors.pink.400}" },
    fg: { value: "{colors.white}" },
  },
  // 情報・リンク・フォーカス（水色）
  info: {
    default: { value: "{colors.cyan.500}" },
    subtle: { value: "{colors.cyan.50}" },
  },
  success: {
    default: { value: "{colors.green.500}" },
    strong: { value: "{colors.green.700}" },
    subtle: { value: "{colors.green.50}" },
    // 準備OKの状況の地
    muted: { value: "{colors.green.100}" },
    // 準備OKの点
    dot: { value: "{colors.green.400}" },
  },
  warning: {
    default: { value: "{colors.yellow.500}" },
    subtle: { value: "{colors.yellow.50}" },
    fg: { value: "{colors.neutral.900}" },
  },
  danger: {
    default: { value: "{colors.red.600}" },
    subtle: { value: "{colors.red.50}" },
  },
  focus: {
    ring: { value: "{colors.cyan.500}" },
  },
  // カード・写真の地に差す淡い色（ピンク・水色・黄色の3色を順に使う）
  tint: {
    pink: { value: "{colors.pink.100}" },
    pinkDeep: { value: "{colors.pink.150}" },
    cyan: { value: "{colors.cyan.75}" },
    yellow: { value: "{colors.yellow.75}" },
    green: { value: "{colors.green.75}" },
    purple: { value: "{colors.purple.75}" },
  },
  // ログイン連携先のブランドの色（ボタンの地にだけ使う）
  brand: {
    discord: { value: "{colors.discord.500}" },
  },
  // 参加者を見分ける色（アバターなど）。順番に割り当てる
  player: {
    1: { value: "{colors.pink.500}" },
    2: { value: "{colors.cyan.500}" },
    3: { value: "{colors.yellow.500}" },
    4: { value: "{colors.pink.400}" },
    5: { value: "{colors.cyan.300}" },
    6: { value: "{colors.yellow.300}" },
    7: { value: "{colors.neutral.600}" },
  },
});
