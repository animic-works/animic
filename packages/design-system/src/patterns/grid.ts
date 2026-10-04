import { definePattern } from "@pandacss/dev";
export const grid = definePattern({
  strict: true,
  properties: {
    columns: { type: "enum", value: ["1", "2", "3", "4"] },
    space: { type: "enum", value: ["normal", "section"] },
  },
  defaultValues: { space: "normal" },
  transform({ columns, space }, { map }) {
    return {
      minWidth: 0,
      containerType: "inline-size",
      containerName: "animic-grid",
      "& > [data-animic-grid-layout]": {
        display: "grid",
        minWidth: 0,
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: map(space, (v) => (v === "normal" ? "5" : "6")),
        _gridTwo: {
          gridTemplateColumns: map(columns, (v) => `repeat(${v === "1" ? 1 : 2}, minmax(0, 1fr))`),
        },
        _gridFull: {
          gridTemplateColumns: map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`),
        },
        "& > *": { minWidth: 0 },
      },
    };
  },
});
