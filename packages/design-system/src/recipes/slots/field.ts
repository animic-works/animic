import { defineSlotRecipe } from "@pandacss/dev";

// 入力欄と、その項目名・補足・エラー
export const field = defineSlotRecipe({
  className: "field",
  description: "1つの入力のまとまり。項目名は必ず付け、エラーは入力欄の下に出す",
  slots: ["root", "label", "input", "helperText", "errorText"],
  base: {
    root: { display: "grid", gap: "0.4rem", minWidth: "0" },
    label: { textStyle: "label", color: "fg.default" },
    input: {
      width: "full",
      py: "0.85rem",
      px: "1.1rem",
      textStyle: "body.md",
      color: "fg.default",
      bg: "bg.surface",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "field",
      outline: "none",
      transitionProperty: "border-color",
      transitionDuration: "fast",
      _placeholder: { color: "fg.subtle" },
      _focus: { borderColor: "border.strong" },
      "&[data-invalid]": { borderColor: "danger.default" },
      _disabled: { bg: "bg.sunken", color: "fg.subtle", cursor: "default" },
    },
    helperText: { textStyle: "caption", color: "fg.muted", m: "0" },
    errorText: {
      textStyle: "caption",
      fontSize: "0.8rem",
      fontWeight: "bold",
      color: "danger.default",
      m: "0",
    },
  },
});
