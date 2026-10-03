import { defineGlobalStyles } from "@pandacss/dev";

// デザインシステム全体の土台。部品ごとのスタイルはここに書かない
export const globalCss = defineGlobalStyles({
  "*, *::before, *::after": {
    boxSizing: "border-box",
  },
  html: {
    colorScheme: "light",
    WebkitTextSizeAdjust: "100%",
  },
  body: {
    margin: "0",
    minHeight: "100svh",
    overflowX: "hidden",
    color: "fg.default",
    fontFamily: "body",
    lineHeight: "normal",
    // Animicの地: 方眼
    bg: "bg.canvas",
    backgroundImage:
      "linear-gradient(token(colors.grid.line) 1px, transparent 1px), linear-gradient(90deg, token(colors.grid.line) 1px, transparent 1px)",
    backgroundSize: "56px 56px",
    WebkitFontSmoothing: "antialiased",
  },
  // トップ: 全画面を縦に並べ、スクロールすると画面ごとに吸い付く（conditions.ts の scrolling）
  "html[data-scroll]": {
    scrollBehavior: "smooth",
    scrollSnapType: "y mandatory",
  },
  "[hidden]": {
    display: "none !important",
  },
  "::selection": {
    bg: "accent.subtle",
    color: "fg.default",
  },
  ":focus-visible": {
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "focus.ring",
    outlineOffset: "3px",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "html[data-scroll]": { scrollBehavior: "auto" },
    "*, *::before, *::after": {
      animationDuration: "instant !important",
      animationIterationCount: "1 !important",
      transitionDuration: "instant !important",
    },
  },
});
