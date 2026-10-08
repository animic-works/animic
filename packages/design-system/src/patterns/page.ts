import { definePattern } from "@pandacss/dev";

export const page = definePattern({
  strict: true,
  properties: {},
  transform() {
    return {
      "& > [data-animic-page-background]": {
        position: "absolute",
        inset: "0",
        zIndex: -1,
        pointerEvents: "none",
      },
      position: "relative",
      isolation: "isolate",
      minHeight: "100svh",
      minWidth: 0,
      overflowX: "clip",
    };
  },
});
