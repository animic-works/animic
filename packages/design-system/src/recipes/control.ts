import { defineStyles } from "@pandacss/dev";
export const enabled = "&:not(:disabled, [disabled], [data-disabled], [aria-disabled=true])";
export const focus = defineStyles({
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "focus.ring",
  outlineOffset: "2px",
});
export const textFocus = defineStyles({
  outlineStyle: "none",
  outlineWidth: "0",
  textDecorationLine: "underline",
  textDecorationThickness: "2px",
  textUnderlineOffset: "0.2em",
});
export const fieldFocus = defineStyles({
  outlineStyle: "none",
  outlineWidth: "0",
  boxShadow: "inset 0 0 0 1px currentColor",
  "@media (forced-colors: active)": {
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineColor: "Highlight",
    outlineOffset: "-2px",
  },
});
export const buttonFocus = defineStyles({
  ...focus,
  "[data-animic-dialog] &": textFocus,
});
export const disabled = defineStyles({
  background: "disabled.bg",
  color: "disabled.fg",
  borderColor: "disabled.border",
  boxShadow: "none",
  transform: "none",
  cursor: "not-allowed",
});
export const control = defineStyles({
  boxSizing: "border-box",
  textStyle: "label",
  fontSynthesis: "none",
  borderStyle: "solid",
  borderWidth: "1",
  borderRadius: "2",
  cursor: "pointer",
  transitionProperty: "transform, box-shadow",
  transitionDuration: "1",
  transitionTimingFunction: "standard",
  _focusVisible: focus,
  _motionReduce: { transitionDuration: "0", transform: "none" },
  _disabled: disabled,
});
