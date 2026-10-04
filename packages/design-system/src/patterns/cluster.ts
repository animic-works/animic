import { definePattern } from "@pandacss/dev";
export const cluster = definePattern({
  strict: true,
  properties: {
    space: { type: "enum", value: ["compact", "normal"] },
    justify: { type: "enum", value: ["start", "center", "end", "between"] },
  },
  defaultValues: { space: "compact", justify: "start" },
  transform({ space, justify }, { map }) {
    return {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      minWidth: 0,
      gap: map(space, (v) => (v === "compact" ? "3" : "5")),
      justifyContent: map(justify, (v) => (v === "between" ? "space-between" : v)),
    };
  },
});
