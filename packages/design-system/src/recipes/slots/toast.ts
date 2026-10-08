import { defineSlotRecipe } from "@pandacss/dev";
export const toast = defineSlotRecipe({
  className: "toast",
  slots: ["viewport", "root", "title", "description", "close"],
  base: {
    viewport: {
      direction: "inherit",
      zIndex: "toast",
      boxSizing: "border-box",
      fontSynthesis: "none",
      "--animic-toast-inset": "token(spacing.5)",
      insetBlockStart:
        "max(var(--animic-toast-inset), var(--animic-toast-safe-block-start, env(safe-area-inset-top, 0px)))",
      insetInlineEnd:
        "max(var(--animic-toast-inset), var(--animic-toast-safe-inline-end, env(safe-area-inset-right, 0px)))",
      "& *, &::before, &::after, & *::before, & *::after": { boxSizing: "border-box" },
    },
    root: {
      direction: "inherit",
      boxSizing: "border-box",
      layerStyle: "surface.floating",
      borderRadius: "2",
      padding: "5",
      paddingInlineEnd: "10",
      borderWidth: "1",
      borderStyle: "solid",
      borderColor: "border.strong",
      width: "min(27rem, calc(100vw - 2rem))",
      color: "fg.default",
      position: "relative",
      insetBlockStart: "0",
      insetInlineEnd: "0",
      transform: "translateY(var(--animic-toast-offset))",
      opacity: "var(--animic-toast-opacity)",
      fontSynthesis: "none",
    },
    title: { textStyle: "label" },
    description: { textStyle: "body.sm", marginBlockStart: "3" },
    close: { position: "absolute", insetBlockStart: "3", insetInlineEnd: "3" },
  },
});
