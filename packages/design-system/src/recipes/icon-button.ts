import { defineRecipe } from "@pandacss/dev";
import {
  buttonFocus,
  buttonControl,
  textFocus,
  disabled,
  buttonAvailable,
  buttonUnavailable,
} from "./control";
export const iconButton = defineRecipe({
  className: "icon-button",
  base: {
    ...buttonControl,
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
    [buttonAvailable]: {
      _hover: { boxShadow: "soft.1" },
      _active: {
        transform: "translateY(2px)",
        boxShadow: "none",
        _motionReduce: { transform: "none" },
      },
    },
    [buttonUnavailable]: disabled,
  },
  variants: {
    appearance: {
      standard: {},
      quiet: {
        border: "0",
        background: "transparent",
        color: "fg.muted",
        [buttonUnavailable]: { background: "transparent", color: "disabled.fg" },
        [buttonAvailable]: {
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
        [buttonAvailable]: {
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
