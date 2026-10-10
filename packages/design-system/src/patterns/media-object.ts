import { definePattern } from "@pandacss/dev";
export const mediaObject = definePattern({
  strict: true,
  properties: { layout: { type: "enum", value: ["inline", "stacked", "adaptive"] } },
  defaultValues: { layout: "inline" },
  transform({ layout }, { map }) {
    return {
      minWidth: 0,
      containerType: "inline-size",
      containerName: "animic-media-object",
      "& > [data-animic-media-layout]": {
        display: "grid",
        minWidth: 0,
        alignItems: "center",
        gap: "0.8rem",
        gridTemplateColumns: map(layout, (v) =>
          v === "inline" ? "auto minmax(0, 1fr)" : "minmax(0, 1fr)",
        ),
        "& > [data-animic-media]": { justifySelf: "start", minWidth: 0 },
        "& > [data-animic-media-content]": { minWidth: 0 },
        "& > [data-animic-media-actions]": { justifySelf: "start", minWidth: 0 },
        "&:has(> [data-animic-media-actions]) > [data-animic-media]": {
          gridRow: map(layout, (v) => (v === "inline" ? "span 2" : "auto")),
          alignSelf: "start",
        },
        _mediaObjectInline: {
          gridTemplateColumns: map(layout, (v) =>
            v === "stacked" ? "minmax(0, 1fr)" : "auto minmax(0, 1fr)",
          ),
          "&:has(> [data-animic-media-actions]) > [data-animic-media]": {
            gridRow: map(layout, (v) => (v === "stacked" ? "auto" : "span 2")),
          },
        },
        _mediaObjectActionsWide: {
          "&:has(> [data-animic-media-actions])": {
            gridTemplateColumns: map(layout, (v) =>
              v === "stacked" ? "minmax(0, 1fr)" : "auto minmax(0, 1fr) auto",
            ),
            "& > [data-animic-media]": { gridRow: "auto", alignSelf: "center" },
          },
        },
      },
    };
  },
});
