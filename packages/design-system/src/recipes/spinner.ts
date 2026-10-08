import { defineRecipe } from "@pandacss/dev";
export const spinner = defineRecipe({
  className: "spinner",
  base: {
    display: "inline-block",
    flexShrink: 0,
    boxSizing: "border-box",
    width: "icon.1",
    height: "icon.1",
    borderRadius: "full",
    borderWidth: "2",
    borderStyle: "solid",
    borderColor: "border.default",
    borderTopColor: "fg.default",
    animationStyle: "loading",
  },
  variants: {
    size: {
      sm: {},
      lg: { width: "3.6rem", height: "3.6rem" },
    },
    tone: {
      neutral: {},
      gradient: {
        border: "0",
        background:
          "conic-gradient(from 0deg, transparent 0 10%, token(colors.accent.secondary) 40%, token(colors.accent.primary) 75%, token(colors.accent.highlight))",
        maskImage:
          "radial-gradient(farthest-side, transparent calc(100% - 0.32rem), #000 calc(100% - 0.3rem))",
        animationDuration: "900ms",
      },
    },
  },
  compoundVariants: [
    {
      tone: "gradient",
      size: "sm",
      css: {
        maskImage:
          "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))",
      },
    },
  ],
  defaultVariants: { size: "sm" },
});
