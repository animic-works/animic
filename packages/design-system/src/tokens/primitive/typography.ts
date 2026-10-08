import { defineTokens } from "@pandacss/dev";

const japaneseFallback =
  '"Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Noto Sans JP", IPAGothic, sans-serif';

export const fonts = defineTokens.fonts({
  zenKaku: { value: `"Zen Kaku Gothic New", ${japaneseFallback}` },
  zenMaru: { value: `"Zen Maru Gothic", ${japaneseFallback}` },
  dela: { value: `"Dela Gothic One", ${japaneseFallback}` },
  jetbrainsMono: { value: '"JetBrains Mono", monospace' },
  montserrat: { value: '"Montserrat", sans-serif' },
});

export const fontSizes = defineTokens.fontSizes({
  0: { value: "0.75rem" },
  1: { value: "0.875rem" },
  2: { value: "1rem" },
  3: { value: "1.25rem" },
  4: { value: "1.5rem" },
  5: { value: "2rem" },
  6: { value: "2.5rem" },
  7: { value: "3rem" },
  8: { value: "4rem" },
  "4.5": { value: "1.75rem" },
  9: { value: "5rem" },
});

export const fontWeights = defineTokens.fontWeights({
  regular: { value: 400 },
  medium: { value: 500 },
  bold: { value: 700 },
  extraBold: { value: 800 },
  black: { value: 900 },
});

export const lineHeights = defineTokens.lineHeights({
  0: { value: 1 },
  1: { value: 1.3 },
  2: { value: 1.5 },
  3: { value: 1.7 },
  4: { value: 1.9 },
});
