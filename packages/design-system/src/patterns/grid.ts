import { definePattern } from "@pandacss/dev";
export const grid = definePattern({
  strict: true,
  properties: {
    collapse: { type: "enum", value: ["progressive", "single", "none"] },
    columns: { type: "enum", value: ["1", "2", "3", "4"] },
    space: { type: "enum", value: ["compact", "normal", "section"] },
  },
  defaultValues: { space: "normal", collapse: "progressive" },
  transform({ columns, space, collapse }, { map }) {
    return {
      "--animic-grid-gap": map(space, (v) =>
        v === "compact"
          ? "token(spacing.3)"
          : v === "section"
            ? "token(spacing.6)"
            : "token(spacing.5)",
      ),
      "--animic-grid-columns": map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`),
      "--animic-grid-intermediate-columns": map(
        columns,
        (v) => `repeat(${v === "1" ? 1 : 2}, minmax(0, 1fr))`,
      ),
      minWidth: 0,
      containerType: "inline-size",
      containerName: "animic-grid",
      "& > [data-animic-grid-layout]": {
        display: "grid",
        minWidth: 0,
        gridTemplateColumns: map(collapse, (v) =>
          v === "none" ? "var(--animic-grid-columns)" : "minmax(0, 1fr)",
        ),
        gap: map(collapse, (v) => (v === "single" ? "4" : "var(--animic-grid-gap)")),
        _gridTwo: {
          gridTemplateColumns: map(collapse, (v) =>
            v === "single"
              ? "minmax(0, 1fr)"
              : v === "none"
                ? "var(--animic-grid-columns)"
                : "var(--animic-grid-intermediate-columns)",
          ),
        },
        _gridFull: {
          gap: "var(--animic-grid-gap)",
          gridTemplateColumns: "var(--animic-grid-columns)",
        },
        "& > *": { minWidth: 0 },
      },
    };
  },
});
