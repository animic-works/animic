import { defineSlotRecipe } from "@pandacss/dev";
export const statGroup = defineSlotRecipe({
  className: "stat-group",
  slots: ["root", "item", "label", "value", "unit"],
  base: {
    root: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 7.5rem), 1fr))",
      _statGroupNarrow: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
      gap: "4",
      _statGroupCompact: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        "&[data-count='5'] > :first-child": { gridColumn: "1 / -1" },
      },
    },
    item: {
      display: "grid",
      gap: "2",
      minWidth: 0,
      padding: "1rem 1.1rem",
      background: "bg.surface",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1.25rem",
      "&[data-accent]": {
        background: "accent.primary",
        color: "fg.inverse",
        borderColor: "accent.primary",
      },
      _statGroupCompact: { padding: "0.75rem" },
    },
    label: { textStyle: "caption" },
    value: { textStyle: "numeric.stat" },
    unit: { textStyle: "caption", marginInlineStart: "1" },
  },
});
