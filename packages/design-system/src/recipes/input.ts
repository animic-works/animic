import { defineRecipe } from "@pandacss/dev";
import { fieldFocus, disabled } from "./control";
export const input = defineRecipe({
  className: "input",
  base: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    minHeight: "control.1",
    paddingInline: "1.1rem",
    paddingBlock: "0.85rem",
    borderRadius: "0.9rem",
    borderWidth: "2",
    borderStyle: "solid",
    borderColor: "border.default",
    transitionProperty: "border-color",
    transitionDuration: "1",
    _motionReduce: { transitionDuration: "0" },
    background: "bg.surface",
    color: "fg.default",
    textStyle: "body.md",
    fontSynthesis: "none",
    _placeholder: { color: "fg.muted" },
    outlineStyle: "none",
    outlineWidth: "0",
    // 淡い枠を、フォーカス中だけ濃くする。エラーの枠はフォーカス中も保つ。
    _focusWithin: {
      ...fieldFocus,
      borderColor: "border.strong",
      _invalid: { borderColor: "status.danger.border" },
    },
    _invalid: { borderColor: "status.danger.border", borderWidth: "2" },
    _disabled: disabled,
  },
  variants: { multiline: { true: { minHeight: "8rem", resize: "vertical" } } },
});
