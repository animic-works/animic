import { defineRecipe } from "@pandacss/dev";

/** 点数の段階を表す、1〜2文字の印（例：S・A）。段階の決め方と色の対応は利用側が持つ。 */
export const grade = defineRecipe({
  className: "grade",
  base: {
    display: "inline-grid",
    placeItems: "center",
    flex: "none",
    aspectRatio: "1",
    borderStyle: "solid",
    borderWidth: "2",
    borderColor: "border.strong",
    color: "fg.default",
    textStyle: "label.stamp",
    lineHeight: "1",
  },
  variants: {
    tone: {
      neutral: { background: "fg.subtle" },
      highlight: { background: "accent.highlight" },
      primary: { background: "accent.primary" },
      secondary: { background: "accent.secondary" },
      success: { background: "status.success.fg", color: "fg.inverse" },
    },
    size: {
      sm: { width: "1.75rem", borderRadius: "0.4rem", fontSize: "0.95rem" },
      // 全体の段階など、まとめの値に添える大きい印。傾けてスタンプのように見せる。
      lg: { width: "3.25rem", borderRadius: "0.75rem", fontSize: "1.75rem", rotate: "-6deg" },
    },
  },
  defaultVariants: { tone: "neutral", size: "sm" },
});
