import { defineRecipe } from "@pandacss/dev";
import { control, enabled } from "./control";
export const button = defineRecipe({
  className: "button",
  base: {
    ...control,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3",
    textAlign: "center",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    [enabled]: {
      _hover: { boxShadow: "soft.1" },
      _active: {
        transform: "translateY(2px)",
        boxShadow: "none",
        _motionReduce: { transform: "none" },
      },
    },
  },
  variants: {
    appearance: {
      primary: {
        [enabled]: {
          background: "action.primary.bg",
          color: "action.primary.fg",
          borderColor: "transparent",
        },
      },
      secondary: {
        [enabled]: { background: "bg.surface", color: "fg.default", borderColor: "border.strong" },
      },
    },
    size: {
      sm: { minHeight: "control.0", paddingInline: "4", paddingBlock: "3" },
      md: { minHeight: "control.1", paddingInline: "5", paddingBlock: "3" },
      lg: { minHeight: "control.2", paddingInline: "6", paddingBlock: "4" },
    },
  },
  defaultVariants: { appearance: "primary", size: "md" },
});
