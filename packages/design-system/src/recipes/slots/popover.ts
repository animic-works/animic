import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";

export const popover = defineSlotRecipe({
  className: "popover",
  slots: ["trigger", "positioner", "content", "title", "body"],
  variants: {
    titleVisibility: {
      visible: {},
      hidden: {
        title: {
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        },
        body: { marginBlockStart: "0" },
      },
    },
  },
  base: {
    trigger: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "control.0",
      minHeight: "control.0",
      borderRadius: "full",
      borderWidth: "0",
      background: "transparent",
      color: "fg.default",
      padding: "0",
      cursor: "pointer",
      _focusVisible: focus,
    },
    positioner: { zIndex: "overlay" },
    content: {
      boxSizing: "border-box",
      textStyle: "body.md",
      fontSynthesis: "none",
      color: "fg.default",
      layerStyle: "surface.floating",
      borderRadius: "1.25rem",
      borderWidth: "2",
      borderColor: "border.default",
      borderStyle: "solid",
      padding: "5",
      width: "17.5rem",
      maxWidth:
        "calc(100vw - 2rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))",
      maxHeight: "var(--available-height)",
      overflowY: "auto",
      "& *, &::before, &::after, & *::before, & *::after": { boxSizing: "border-box" },
      _open: {
        animationName: "popoverEnter",
        animationDuration: "180ms",
        animationTimingFunction: "expressive",
        _motionReduce: { animationName: "none" },
      },
    },
    title: { textStyle: "heading.sm", margin: "0" },
    body: { marginBlockStart: "5", minWidth: 0 },
  },
});
