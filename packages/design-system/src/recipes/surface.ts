import { defineRecipe } from "@pandacss/dev";
export const surface = defineRecipe({
  className: "surface",
  base: { boxSizing: "border-box", minWidth: 0, borderRadius: "3", color: "fg.default" },
  variants: {
    appearance: {
      plain: { layerStyle: "surface.base" },
      raised: { layerStyle: "surface.raised" },
      framed: { layerStyle: "surface.framed" },
    },
    padding: { compact: { padding: "5" }, normal: { padding: "6" }, spacious: { padding: "7" } },
  },
  defaultVariants: { appearance: "plain", padding: "normal" },
});
