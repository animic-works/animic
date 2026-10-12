import { defineLayerStyles } from "@pandacss/dev";
export const layerStyles = defineLayerStyles({
  "text.highlight": {
    value: {
      backgroundImage:
        "linear-gradient(transparent 62%, token(colors.accent.highlight) 62% 92%, transparent 92%)",
    },
  },
  "surface.base": { value: { background: "bg.surface", boxShadow: "none" } },
  "surface.subtle": { value: { background: "bg.subtle", boxShadow: "none" } },
  "surface.raised": {
    value: {
      background: "bg.surface",
      borderColor: "border.default",
      borderWidth: "1",
      borderStyle: "solid",
      boxShadow: "soft.1",
    },
  },
  "surface.framed": {
    value: {
      background: "bg.surface",
      borderColor: "border.strong",
      borderWidth: "2",
      borderStyle: "solid",
      boxShadow: "solid.1",
    },
  },
  "surface.floating": { value: { background: "bg.surface", boxShadow: "soft.2" } },
  "overlay.scrim": {
    value: { background: "color-mix(in srgb, token(colors.bg.inverse) 45%, transparent)" },
  },
});
