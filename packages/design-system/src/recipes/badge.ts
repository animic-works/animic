import { defineRecipe } from "@pandacss/dev";
export const badge = defineRecipe({
  className: "badge",
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    paddingInline: "3",
    paddingBlock: "1",
    borderRadius: "full",
    borderStyle: "solid",
    borderWidth: "1",
    textStyle: "caption",
  },
  variants: {
    tone: {
      neutral: { background: "bg.subtle", color: "fg.default", borderColor: "border.default" },
      success: {
        background: "status.success.bg",
        color: "status.success.fg",
        borderColor: "status.success.border",
      },
      danger: {
        background: "status.danger.bg",
        color: "status.danger.fg",
        borderColor: "status.danger.border",
      },
    },
  },
  defaultVariants: { tone: "neutral" },
});
