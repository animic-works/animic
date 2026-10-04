import { defineStyles } from "@pandacss/dev";
export const enabled = "&:not(:disabled, [disabled], [data-disabled], [aria-disabled=true])";
export const focus = defineStyles({
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "focus.ring",
  outlineOffset: "2px",
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
