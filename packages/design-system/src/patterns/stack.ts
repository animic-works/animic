import { definePattern } from "@pandacss/dev";
export const stack = definePattern({
  strict: true,
  properties: {
    fill: { type: "boolean" },
    justify: { type: "enum", value: ["start", "center", "between"] },
    space: { type: "enum", value: ["compact", "normal", "section", "spacious", "fluid", "tight"] },
    align: { type: "enum", value: ["stretch", "start", "center"] },
  },
  defaultValues: { space: "normal", align: "stretch" },
  transform({ space, align, fill, justify }, { map }) {
    return {
      display: "flex",
      minHeight: map(fill, (v) => (v ? "100%" : undefined)),
      justifyContent: map(justify, (v) => (v === "between" ? "space-between" : v)),
      flexDirection: "column",
      minWidth: 0,
      gap: map(space, (v) =>
        v === "tight"
          ? "2"
          : v === "fluid"
            ? "clamp(0.5rem, 1.6svh, 0.9rem)"
            : v === "compact"
              ? "3"
              : v === "section"
                ? "6"
                : v === "spacious"
                  ? "9"
                  : "5",
      ),
      alignItems: align,
      _stackCompact: { gap: map(space, (v) => (v === "spacious" ? "5" : undefined)) },
    };
  },
});
