import { defineGlobalStyles } from "@pandacss/dev";
export const globalCss = defineGlobalStyles({
  ":where(html:has([data-animic-root]))": { WebkitTapHighlightColor: "transparent" },
  ":where(html:is([data-animic-scrollbars=pending], [data-animic-scrollbars=ready]), html:is([data-animic-scrollbars=pending], [data-animic-scrollbars=ready]) [data-animic-scroll-viewport])":
    {
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      "@media (forced-colors: active)": {
        scrollbarWidth: "auto",
        "&::-webkit-scrollbar": { display: "block" },
      },
    },
  ":where([data-animic-scroll-dragging])": { scrollSnapType: "none !important" },
  ":where(body:has([data-animic-page]))": { margin: "0" },
  ':where(html:has([data-animic-page-scroll="sections"]))': {
    scrollSnapType: "y mandatory",
  },
  // Pointer focus must not inherit the browser outline when focus is restored.
  ":where([data-animic-input=pointer]) :where(:focus)": { outlineStyle: "none", outlineWidth: "0" },
  ":where([data-animic-root])": {
    textStyle: "body.md",
    color: "fg.default",
    background: "bg.canvas",
    fontSynthesis: "none",
  },
  ":where([data-animic-root], [data-animic-root] *)": {
    boxSizing: "border-box",
    "&::before, &::after": { boxSizing: "border-box" },
  },
});
