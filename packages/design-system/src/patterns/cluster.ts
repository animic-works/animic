import { definePattern } from "@pandacss/dev";
export const cluster = definePattern({
  strict: true,
  properties: {
    layout: { type: "enum", value: ["wrap", "nowrap", "adaptive", "adaptive-fill"] },
    space: { type: "enum", value: ["compact", "normal"] },
    justify: { type: "enum", value: ["start", "center", "end", "between"] },
  },
  defaultValues: { layout: "wrap", space: "compact", justify: "start" },
  transform({ space, justify, layout }, { map }) {
    return {
      display: "flex",
      flexWrap: map(layout, (v) => (v === "nowrap" ? "nowrap" : "wrap")),
      alignItems: "center",
      minWidth: 0,
      _clusterCompact: {
        alignItems: map(layout, (value) => (value === "adaptive-fill" ? "stretch" : "center")),
        flexDirection: map(layout, (value) =>
          value === "wrap" || value === "nowrap" ? "row" : "column",
        ),
      },
      gap: map(space, (v) => (v === "compact" ? "3" : "5")),
      justifyContent: map(justify, (v) => (v === "between" ? "space-between" : v)),
    };
  },
});
