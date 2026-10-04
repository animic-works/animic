import { definePattern } from "@pandacss/dev";
export const split = definePattern({
  strict: true,
  properties: { layout: { type: "enum", value: ["equal", "main-aside", "aside-main"] } },
  transform({ layout }, { map }) {
    return {
      minWidth: 0,
      containerType: "inline-size",
      containerName: "animic-split",
      "& > [data-animic-split-layout]": {
        display: "grid",
        minWidth: 0,
        gap: "6",
        gridTemplateColumns: "minmax(0, 1fr)",
        _splitEqual: {
          gridTemplateColumns: map(layout, (v) =>
            v === "equal" ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)",
          ),
        },
        _splitAsymmetric: {
          gridTemplateColumns: map(layout, (v) =>
            v === "main-aside"
              ? "minmax(0, 2fr) minmax(0, 1fr)"
              : v === "aside-main"
                ? "minmax(0, 1fr) minmax(0, 2fr)"
                : "minmax(0, 1fr) minmax(0, 1fr)",
          ),
        },
        "& > *": { minWidth: 0 },
      },
    };
  },
});
