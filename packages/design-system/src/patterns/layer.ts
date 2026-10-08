import { definePattern } from "@pandacss/dev";

export const layer = definePattern({
  strict: true,
  properties: { layout: { type: "enum", value: ["overlay", "adaptive"] } },
  defaultValues: { layout: "overlay" },
  transform({ layout }, { map }) {
    return {
      position: "relative",
      isolation: "isolate",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      "& > [data-animic-layer=content]": {
        position: "relative",
        zIndex: 1,
        minWidth: 0,
        flexShrink: 0,
      },
      "& > [data-animic-layer=background]": {
        position: "absolute",
        inset: "0",
        zIndex: -1,
        pointerEvents: "none",
      },
      "& > [data-animic-layer=artwork]": {
        position: "absolute",
        inset: "0",
        zIndex: 0,
        pointerEvents: "none",
        minWidth: 0,
        _layerStack: {
          position: map(layout, (value) => (value === "adaptive" ? "relative" : "absolute")),
          inset: map(layout, (value) => (value === "adaptive" ? "auto" : "0")),
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gridTemplateRows: "minmax(0, 1fr)",
          placeItems: "center",
          flex: "1 1 0",
          containerType: map(layout, (value) => (value === "adaptive" ? "size" : undefined)),
          minHeight: map(layout, (value) => (value === "adaptive" ? "7rem" : "auto")),
        },
        _layerPortrait: {
          minHeight: map(layout, (value) => (value === "adaptive" ? "12rem" : "auto")),
        },
      },
    };
  },
});
