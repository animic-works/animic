import { defineTokens } from "@pandacss/dev";

// 書体。Webフォントは src/routes/__root.tsx で読み込み、読み込めない間は端末にある書体で代わりに表示できる並びにする
export const fonts = defineTokens.fonts({
  display: {
    value:
      '"Dela Gothic One", "Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif',
  },
  round: { value: '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif' },
  body: { value: '"Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic", system-ui, sans-serif' },
  latin: { value: '"Montserrat", "Helvetica Neue", Arial, sans-serif' },
  mono: { value: '"JetBrains Mono", ui-monospace, Menlo, monospace' },
});

export const fontSizes = defineTokens.fontSizes({
  "2xs": { value: "0.6875rem" },
  xs: { value: "0.75rem" },
  sm: { value: "0.875rem" },
  md: { value: "1rem" },
  lg: { value: "1.125rem" },
  xl: { value: "1.375rem" },
  "2xl": { value: "1.75rem" },
  "3xl": { value: "2.25rem" },
  "4xl": { value: "3rem" },
  "5xl": { value: "4rem" },
});

export const fontWeights = defineTokens.fontWeights({
  regular: { value: "500" },
  bold: { value: "700" },
  heavy: { value: "900" },
});

export const lineHeights = defineTokens.lineHeights({
  none: { value: "1" },
  // 書体の既定。本文・見出し・ボタンはこれ（モックは行の高さを指定しない）
  normal: { value: "normal" },
  // 注記・規約など、読ませる小さな文章
  relaxed: { value: "1.7" },
});

export const letterSpacings = defineTokens.letterSpacings({
  normal: { value: "0" },
  wide: { value: "0.04em" },
  wider: { value: "0.12em" },
  widest: { value: "0.2em" },
});
