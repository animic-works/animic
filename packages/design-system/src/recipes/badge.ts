import { defineRecipe } from "@pandacss/dev";

// 小さなラベル（ホスト・準備OK・難易度など）。色の意味（tone）と塗り方（variant）を持つ
export const badge = defineRecipe({
  className: "badge",
  description: "状態や分類を示す小さなラベル。押せるものには使わない",
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    borderRadius: "control",
    fontFamily: "body",
    fontWeight: "bold",
    lineHeight: "none",
    whiteSpace: "nowrap",
    borderWidth: "thick",
    borderStyle: "solid",
    borderColor: "transparent",
  },
  variants: {
    tone: {
      neutral: {
        "--badge-strong": "token(colors.fg.default)",
        "--badge-soft": "token(colors.bg.sunken)",
        "--badge-on": "token(colors.fg.inverse)",
      },
      accent: {
        "--badge-strong": "token(colors.accent.default)",
        "--badge-soft": "token(colors.accent.subtle)",
        "--badge-on": "token(colors.accent.fg)",
      },
      info: {
        "--badge-strong": "token(colors.info.default)",
        "--badge-soft": "token(colors.info.subtle)",
        "--badge-on": "token(colors.fg.inverse)",
      },
      success: {
        "--badge-strong": "token(colors.success.strong)",
        "--badge-soft": "token(colors.success.subtle)",
        "--badge-on": "token(colors.fg.inverse)",
      },
      warning: {
        "--badge-strong": "token(colors.warning.default)",
        "--badge-soft": "token(colors.warning.subtle)",
        "--badge-on": "token(colors.warning.fg)",
      },
      danger: {
        "--badge-strong": "token(colors.danger.default)",
        "--badge-soft": "token(colors.danger.subtle)",
        "--badge-on": "token(colors.fg.inverse)",
      },
    },
    variant: {
      subtle: { bg: "var(--badge-soft)", color: "var(--badge-strong)" },
      solid: { bg: "var(--badge-strong)", color: "var(--badge-on)" },
      outline: { bg: "bg.surface", color: "var(--badge-strong)", borderColor: "border.default" },
    },
    size: {
      sm: { px: "2", py: "1", fontSize: "2xs" },
      md: { px: "3", py: "1.5", fontSize: "xs" },
    },
  },
  // warningの塗りつぶしは文字を黒にする（黄色の上の白は読みにくい）
  compoundVariants: [{ tone: "warning", variant: "subtle", css: { color: "fg.default" } }],
  defaultVariants: { tone: "neutral", variant: "subtle", size: "md" },
});
