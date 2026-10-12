import { definePattern } from "@pandacss/dev";

export const actionGroup = definePattern({
  strict: true,
  properties: {
    layout: {
      type: "enum",
      value: ["inline", "paired", "adaptive", "fill", "responsive", "confirm"],
    },
    align: { type: "enum", value: ["start", "center", "end"] },
  },
  defaultValues: { layout: "inline", align: "start" },
  transform({ layout, align }, { map }) {
    return {
      display: map(layout, (v) => (v === "confirm" ? "grid" : "flex")),
      gridTemplateColumns: map(layout, (v) => (v === "confirm" ? "1fr 1.5fr" : undefined)),
      flexWrap: map(layout, (v) => (v === "fill" ? "nowrap" : "wrap")),
      alignItems: "center",
      justifyContent: align,
      gap: map(layout, (value) =>
        value === "inline" || value === "fill" || value === "responsive" || value === "confirm"
          ? "3"
          : "7",
      ),
      minWidth: 0,
      _actionCompact: {
        display: map(layout, (v) => (v === "adaptive" || v === "confirm" ? "grid" : "flex")),
        gridTemplateColumns: map(layout, (v) =>
          v === "confirm" ? "1fr 1.5fr" : v === "adaptive" ? "1fr 1.25fr" : undefined,
        ),
        flexWrap: map(layout, (value) =>
          value === "adaptive" || value === "fill" ? "nowrap" : "wrap",
        ),
        gap: map(layout, (value) => (value === "paired" ? "7" : "3")),
      },
      _actionPortrait: { gap: map(layout, (v) => (v === "adaptive" ? "5" : undefined)) },
      "& > *": {
        minWidth: map(layout, (value) => (value === "responsive" ? "min(100%, 12rem)" : 0)),
        _actionPortrait: { flex: map(layout, (v) => (v === "adaptive" ? "1 1 0" : undefined)) },
        flex: map(layout, (value) =>
          value === "fill"
            ? "1 1 auto"
            : value === "responsive"
              ? "0 1 auto"
              : value === "inline"
                ? "0 1 auto"
                : "0 1 24rem",
        ),
        _actionCompact: {
          flex: map(layout, (value) =>
            value === "adaptive" || value === "fill"
              ? "1 1 auto"
              : value === "responsive"
                ? "1 1 100%"
                : value === "paired"
                  ? "0 1 24rem"
                  : "0 1 auto",
          ),
        },
      },
    };
  },
});
