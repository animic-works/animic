import { defineTokens } from "@pandacss/dev";

export const shadows = defineTokens.shadows({
  none: { value: "none" },
  // カードがふわっと浮く影
  sm: { value: "0 1px 0 rgb(11 27 43 / 0.04), 0 8px 20px -14px rgb(11 27 43 / 0.35)" },
  md: { value: "0 12px 32px -20px rgb(11 27 43 / 0.35)" },
  lg: { value: "0 1px 0 rgb(11 27 43 / 0.04), 0 30px 60px -30px rgb(11 27 43 / 0.35)" },
  // ピンクのボタンの光
  glow: { value: "0 0 0 5px rgb(255 45 135 / 0.16), 0 12px 26px -10px rgb(255 45 135 / 0.6)" },
  // トップの大きなボタンの光（輪を少し強く）
  glowStrong: {
    value: "0 0 0 5px rgb(255 45 135 / 0.18), 0 14px 30px -10px rgb(255 45 135 / 0.6)",
  },
  // ナビの「ルームに参加」など、小さなピンクのボタンの光
  glowSoft: { value: "0 8px 18px -8px rgb(255 45 135 / 0.7)" },
  // ステッカーのような紺の硬い影（上から順に厚い・中くらい・薄い）
  sticker: { value: "0 8px 0 #0b1b2b" },
  stickerSm: { value: "0 6px 0 #0b1b2b" },
  stickerXs: { value: "0 5px 0 #0b1b2b" },
  // 上部のナビと右端の現在位置の浮き
  bar: { value: "0 10px 30px -18px rgb(11 27 43 / 0.25)" },
  pager: { value: "0 6px 18px -8px rgb(11 27 43 / 0.35)" },
  // 画面の端に固定するボタンの浮き
  float: { value: "0 8px 20px -10px rgb(11 27 43 / 0.5)" },
});

export const borderWidths = defineTokens.borderWidths({
  none: { value: "0" },
  thin: { value: "1px" },
  thick: { value: "2px" },
  // ステッカーのような紺の縁
  heavy: { value: "2.5px" },
});

export const durations = defineTokens.durations({
  instant: { value: "0.01ms" },
  fast: { value: "150ms" },
  normal: { value: "280ms" },
  slow: { value: "500ms" },
  // 画面の切り替えやカードの登場など、大きな動き
  slower: { value: "700ms" },
});

export const easings = defineTokens.easings({
  standard: { value: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
  // 少し行きすぎて戻る、弾む動き
  bounce: { value: "cubic-bezier(0.2, 0.9, 0.3, 1.4)" },
  // 大きく行きすぎて戻る、飛び出す動き（ロゴ・文字の確定）
  pop: { value: "cubic-bezier(0.3, 1.6, 0.5, 1)" },
  // 帯の塗り・下線の移動など、ゆっくり入ってゆっくり止まる動き
  sweep: { value: "cubic-bezier(0.65, 0, 0.35, 1)" },
  // カードが下から弾んで現れる動き
  rise: { value: "cubic-bezier(0.2, 0.9, 0.3, 1.15)" },
  linear: { value: "linear" },
});

export const zIndex = defineTokens.zIndex({
  base: { value: "0" },
  raised: { value: "1" },
  sticky: { value: "10" },
  overlay: { value: "30" },
  modal: { value: "40" },
  toast: { value: "50" },
  // 画面遷移の帯（すべての手前）
  wipe: { value: "100" },
});

export const breakpoints = {
  sm: "560px",
  md: "860px",
  lg: "1100px",
  xl: "1440px",
};
