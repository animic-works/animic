import { defineSlotRecipe } from "@pandacss/dev";
export const progress = defineSlotRecipe({
  className: "progress",
  slots: ["root", "label", "track", "fill", "value"],
  base: {
    root: { display: "flex", flexDirection: "column", gap: "3", minWidth: 0 },
    label: { textStyle: "label", color: "fg.default" },
    track: {
      height: "0.5rem",
      borderRadius: "full",
      overflow: "hidden",
      background: "bg.subtle",
      borderWidth: "1",
      borderStyle: "solid",
      borderColor: "border.default",
    },
    fill: {
      height: "100%",
      background: "accent.primary",
      width: "var(--animic-progress-value)",
      _indeterminate: { width: "100%" },
    },
    value: { textStyle: "numeric", color: "fg.default" },
  },
});
