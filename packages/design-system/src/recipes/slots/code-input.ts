import { defineSlotRecipe } from "@pandacss/dev";
import { codeCharacter } from "../code-character";

export const codeInput = defineSlotRecipe({
  className: "code-input",
  slots: ["root", "input", "cells", "cell"],
  base: {
    root: {
      position: "relative",
      minWidth: 0,
      borderRadius: "1",
      _focusWithinVisible: {
        "& [data-active]": {
          boxShadow: "0 0 0 3px color-mix(in srgb, token(colors.accent.primary) 18%, transparent)",
        },
      },
    },
    input: {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "text",
      fontSize: "2",
      margin: "0",
      padding: "0",
      borderWidth: "0",
    },
    cells: { display: "flex", gap: "2", pointerEvents: "none" },
    cell: {
      ...codeCharacter,
      flex: "1 1 0",
      height: "control.2",
      borderWidth: "2",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "1",
      background: "bg.surface",
      color: "fg.default",
      fontSize: "4",
      transition: "border-color 150ms ease, background-color 150ms ease",
      _motionReduce: { transition: "none" },
      "&:empty::before": {
        content: '""',
        width: "0.35rem",
        height: "0.35rem",
        borderRadius: "full",
        background: "#d3d7dd",
      },
      "&[data-filled]": { background: "#fff0f7", borderColor: "border.strong" },
      "[data-complete] &": { borderColor: "accent.primary" },
      "&[data-active]": {
        borderColor: "accent.primary",
      },
      "&[data-active]:empty::before": {
        width: "2px",
        height: "45%",
        borderRadius: "1px",
        background: "accent.primary",
        animation: "caretBlink 1000ms steps(1) infinite",
        _motionReduce: { animation: "none" },
      },
      "&[data-selected]": { background: "selection.bg", borderColor: "selection.border" },
      "[data-invalid-all] &": { borderColor: "status.danger.border" },
      "&[data-invalid]": {
        borderColor: "status.danger.border",
        background: "#ffe4ee",
        color: "status.danger.fg",
      },
      "[data-disabled] &": {
        background: "disabled.bg",
        color: "disabled.fg",
        borderColor: "disabled.border",
      },
    },
  },
  variants: {
    size: {
      standard: {},
      compact: {
        cells: { gap: "clamp(0.25rem, 1.2vw, 0.4rem)" },
        cell: {
          height: "auto",
          aspectRatio: "3 / 4",
          fontSize: "clamp(1.1rem, 5vw, 1.5rem)",
          borderRadius: "0.6rem",
        },
      },
    },
  },
  defaultVariants: { size: "standard" },
});
