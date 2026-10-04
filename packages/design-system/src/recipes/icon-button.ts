import { defineRecipe } from "@pandacss/dev";
import { control, disabled, enabled } from "./control";
export const iconButton = defineRecipe({
  className: "icon-button",
  base: {
    ...control,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "bg.surface",
    color: "fg.default",
    borderColor: "border.default",
    padding: "3",
    "& > svg": { width: "icon.1", height: "icon.1" },
    [enabled]: {
      _hover: { boxShadow: "soft.1" },
      _active: {
        transform: "translateY(2px)",
        boxShadow: "none",
        _motionReduce: { transform: "none" },
      },
    },
    _disabled: disabled,
  },
  variants: {
    size: {
      sm: { width: "control.0", height: "control.0" },
      md: { width: "control.1", height: "control.1" },
      lg: {
        width: "control.2",
        height: "control.2",
        "& > svg": { width: "icon.2", height: "icon.2" },
      },
    },
  },
  defaultVariants: { size: "md" },
});
