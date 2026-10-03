import { defineTokens } from "@pandacss/dev";

// 余白と大きさの段階（4pxを1とする）。モックの細かな値はこの段階に寄せる
const steps = {
  0: "0",
  "0.5": "0.125rem",
  1: "0.25rem",
  "1.5": "0.375rem",
  2: "0.5rem",
  "2.5": "0.625rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
};

export const spacing = defineTokens.spacing(
  Object.fromEntries(Object.entries(steps).map(([key, value]) => [key, { value }])),
);

// 要素の幅・高さ。余白の段階に、画面の幅の目安を足す
export const sizes = defineTokens.sizes({
  ...Object.fromEntries(Object.entries(steps).map(([key, value]) => [key, { value }])),
  // ロゴ・一覧の最大の高さなど、余白より大きい要素の幅
  28: { value: "7rem" },
  40: { value: "10rem" },
  52: { value: "13rem" },
  80: { value: "20rem" },
  full: { value: "100%" },
  min: { value: "min-content" },
  max: { value: "max-content" },
  fit: { value: "fit-content" },
  // 本文の読みやすい幅と、画面の最大幅
  prose: { value: "27rem" },
  dialog: { value: "25rem" },
  sm: { value: "40rem" },
  md: { value: "48rem" },
  doc: { value: "50rem" },
  lg: { value: "60rem" },
  xl: { value: "72rem" },
  "2xl": { value: "76rem" },
});
