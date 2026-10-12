import { definePattern } from "@pandacss/dev";
export const overlay = definePattern({
  strict: true,
  properties: {},
  transform() {
    return {
      position: "fixed",
      inset: "0",
      zIndex: "overlay",
      pointerEvents: "none",
      overflow: "hidden",
    };
  },
});
