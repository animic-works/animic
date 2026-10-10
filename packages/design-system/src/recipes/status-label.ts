import { defineRecipe } from "@pandacss/dev";

export const statusLabel = defineRecipe({
  className: "status-label",
  base: {
    display: "inline-flex",
    // 文字のない丸もベースラインに合わせると下へずれるため、上下中央に揃える。
    alignItems: "center",
    gap: "0.3rem",
    width: "fit-content",
    // 太字のフォントを読み込むText Styleを使い、大きさだけを変える。
    textStyle: "label.supporting",
    fontSize: "0.72rem",
    color: "fg.subtle",
    "&::before": {
      content: '""',
      flexShrink: 0,
      width: "0.5rem",
      height: "0.5rem",
      borderRadius: "full",
      background: "border.default",
    },
  },
  variants: {
    tone: {
      neutral: {},
      success: {
        color: "status.success.fg",
        "&::before": { background: "status.success.indicator" },
      },
    },
    appearance: {
      inline: {},
      badge: {
        padding: "0.3rem 0.85rem",
        borderRadius: "full",
        background: "bg.subtle",
        fontSize: "0.82rem",
        gap: "0.4rem",
        whiteSpace: "nowrap",
        "&::before": { width: "0.55rem", height: "0.55rem" },
      },
    },
  },
  compoundVariants: [
    { appearance: "badge", tone: "neutral", css: { color: "fg.default" } },
    { appearance: "badge", tone: "success", css: { background: "status.success.bg" } },
  ],
  defaultVariants: { tone: "neutral", appearance: "inline" },
});
