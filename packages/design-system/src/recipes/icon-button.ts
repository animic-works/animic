import { defineRecipe } from "@pandacss/dev";
import { buttonFocus, control, textFocus, disabled, enabled } from "./control";
export const iconButton = defineRecipe({
  className: "icon-button",
  base: {
    ...control,
    _focusVisible: {
      ...buttonFocus,
      "[data-animic-dialog] &": { ...textFocus, background: "bg.subtle" },
    },
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
    appearance: {
      standard: {},
      quiet: {
        border: "0",
        background: "transparent",
        color: "fg.muted",
        _disabled: { background: "transparent", color: "disabled.fg" },
        [enabled]: {
          background: "transparent",
          _hover: { background: "bg.subtle", boxShadow: "none" },
        },
      },
    },
    shape: {
      rounded: {},
      circle: {
        borderRadius: "full",
        borderWidth: "2",
        [enabled]: {
          borderColor: "border.default",
          boxShadow: "soft.1",
          transition: "background-color 200ms ease, color 200ms ease, transform 150ms ease",
          _hover: {
            background: "accent.primary",
            color: "fg.inverse",
            borderColor: "accent.primary",
          },
          _active: { transform: "scale(0.94)", boxShadow: "soft.1" },
          _motionReduce: { transition: "none", _active: { transform: "none" } },
        },
      },
    },
    size: {
      xs: { width: "1.75rem", height: "1.75rem", minHeight: "1.75rem", padding: "0" },
      sm: { width: "control.0", height: "control.0" },
      md: { width: "control.1", height: "control.1" },
      lg: {
        width: "control.2",
        height: "control.2",
        "& > svg": { width: "icon.2", height: "icon.2" },
      },
    },
  },
  defaultVariants: { size: "md", shape: "rounded" },
});
