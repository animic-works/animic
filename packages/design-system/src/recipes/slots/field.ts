import { defineSlotRecipe } from "@pandacss/dev";
export const field = defineSlotRecipe({
  className: "field",
  slots: ["root", "label", "control", "description", "error"],
  base: {
    root: { display: "flex", flexDirection: "column", gap: "3", minWidth: 0 },
    label: { textStyle: "label", color: "fg.default" },
    control: { minWidth: 0 },
    description: { textStyle: "body.sm", color: "fg.muted" },
    error: { textStyle: "body.sm", color: "status.danger.fg" },
  },
});
