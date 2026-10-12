import { defineSlotRecipe } from "@pandacss/dev";

export const focusLayout = defineSlotRecipe({
  className: "focus-layout",
  slots: ["root", "artwork", "content", "brand"],
  base: {
    brand: { display: "flex", justifyContent: "center", _focusLayoutCompact: { display: "none" } },
    root: {
      position: "relative",
      minHeight: "100svh",
      display: "grid",
      placeItems: "center",
      padding: "5rem 1rem 3rem",
      isolation: "isolate",
      // 装飾・登場演出のはみ出しで本文のスクロール領域を増やさない。
      overflow: "clip",
      _focusLayoutCompact: { display: "flex", flexDirection: "column", padding: "0" },
    },
    artwork: {
      display: "none",
      _focusLayoutCompact: {
        display: "grid",
        position: "relative",
        flex: "1 0 auto",
        minHeight: "15rem",
        width: "100%",
        minWidth: "0",
      },
    },
    content: {
      width: "100%",
      maxWidth: "27rem",
      minWidth: "0",
      position: "relative",
      _focusLayoutCompact: { maxWidth: "none" },
    },
  },
});
