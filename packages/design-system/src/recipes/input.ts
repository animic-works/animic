import { defineRecipe } from "@pandacss/dev";
import { focus, disabled } from "./control";
export const input = defineRecipe({
  className: "input",
  base: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    minHeight: "control.1",
    paddingInline: "4",
    paddingBlock: "3",
    borderRadius: "1",
    borderWidth: "1",
    borderStyle: "solid",
    borderColor: "border.strong",
    background: "bg.surface",
    color: "fg.default",
    textStyle: "body.md",
    fontSynthesis: "none",
    _placeholder: { color: "fg.muted" },
    _focusVisible: focus,
    _invalid: { borderColor: "status.danger.border", borderWidth: "2" },
    _disabled: disabled,
  },
  variants: { multiline: { true: { minHeight: "8rem", resize: "vertical" } } },
});
