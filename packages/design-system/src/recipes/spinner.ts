import { defineRecipe } from "@pandacss/dev";

// 処理中を示す回転する輪。色は文字色を受け継ぐ
export const spinner = defineRecipe({
  className: "spinner",
  description: "処理中の表示。ボタンの中や読み込み中の場所に置く",
  base: {
    display: "inline-block",
    flexShrink: "0",
    borderRadius: "full",
    borderStyle: "solid",
    borderColor: "current",
    borderRightColor: "transparent",
    animationStyle: "spin",
  },
  variants: {
    size: {
      sm: { width: "4", height: "4", borderWidth: "thick" },
      md: { width: "6", height: "6", borderWidth: "thick" },
    },
  },
  defaultVariants: { size: "sm" },
});
