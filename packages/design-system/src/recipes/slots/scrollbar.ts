import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";

export const scrollbar = defineSlotRecipe({
  className: "scrollbar",
  slots: ["layer", "track", "thumb"],
  base: {
    layer: {
      "--animic-scrollbar-thickness": "8px",
      "--animic-scrollbar-min-thumb": "28px",
      display: "none",
      "[data-animic-scrollbars=ready] &": { display: "block" },
      position: "fixed",
      inset: "0",
      "&[data-document]": {
        top: "var(--animic-viewport-top, 0px)",
        left: "var(--animic-viewport-left, 0px)",
        width: "var(--animic-viewport-width, auto)",
        height: "var(--animic-viewport-height, auto)",
      },
      pointerEvents: "none",
      zIndex: "scrollbar",
      "@media (forced-colors: active)": { "[data-animic-scrollbars] &": { display: "none" } },
    },
    track: {
      display: "none",
      "&[data-visible]": { display: "block" },
      position: "absolute",
      pointerEvents: "none",
      touchAction: "none",
      userSelect: "none",
      boxSizing: "border-box",
      borderRadius: "0",
      opacity: 0,
      transition: "opacity 180ms ease, background-color 180ms ease",
      background: "transparent",
      outline: "none",
      _hover: {
        opacity: 1,
        pointerEvents: "auto",
        background: "color-mix(in srgb, token(colors.fg.default) 8%, transparent)",
      },
      _focusVisible: { ...focus, outlineOffset: "-2px", opacity: 1, pointerEvents: "auto" },
      "[data-animic-scrollbars][data-active] > &, &[data-dragging]": {
        opacity: 1,
        pointerEvents: "auto",
      },
      _motionReduce: { transition: "none" },
      "@media (pointer: coarse)": {
        // タッチの操作幅だけを内側へ広げ、表示位置とトラックの寸法は変えない。
        _before: { content: '""', position: "absolute", inset: "0" },
        "&[aria-orientation=vertical]::before": {
          width: "24px",
          left: "auto",
          "[data-rtl] &": { left: "0", right: "auto" },
        },
        "&[aria-orientation=horizontal]::before": { height: "24px", top: "auto" },
      },
      "&[aria-orientation=vertical]": {
        width: "var(--animic-scrollbar-thickness)",
        top: "var(--animic-track-top, 0px)",
        bottom: "var(--animic-track-bottom, 0px)",
        right: "var(--animic-track-right, 0px)",
        "[data-horizontal] &": {
          bottom: "calc(var(--animic-track-bottom, 0px) + var(--animic-scrollbar-thickness))",
        },
        "[data-rtl] &": { left: "var(--animic-track-left, 0px)", right: "auto" },
      },
      "&[aria-orientation=horizontal]": {
        height: "var(--animic-scrollbar-thickness)",
        left: "var(--animic-track-left, 0px)",
        right: "var(--animic-track-right, 0px)",
        bottom: "var(--animic-track-bottom, 0px)",
        "[data-vertical]:not([data-rtl]) &": {
          right: "calc(var(--animic-track-right, 0px) + var(--animic-scrollbar-thickness))",
        },
        "[data-vertical][data-rtl] &": {
          left: "calc(var(--animic-track-left, 0px) + var(--animic-scrollbar-thickness))",
        },
      },
    },
    thumb: {
      position: "absolute",
      borderRadius: "full",
      background: "fg.muted",
      "[aria-orientation=vertical] &": {
        width: "4px",
        height: "var(--animic-thumb-size)",
        top: "0",
        left: "50%",
        transform: "translate3d(-50%, var(--animic-thumb-offset, 0px), 0)",
      },
      "[aria-orientation=horizontal] &": {
        height: "4px",
        width: "var(--animic-thumb-size)",
        left: "0",
        top: "50%",
        transform: "translate3d(var(--animic-thumb-offset, 0px), -50%, 0)",
      },
    },
  },
});
