import { defineGlobalStyles } from "@pandacss/dev";
export const globalCss = defineGlobalStyles({
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
