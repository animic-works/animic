import { defineSlotRecipe } from "@pandacss/dev";
export const field = defineSlotRecipe({
  className: "field",
  slots: ["root", "label", "control", "description", "error"],
  variants: {
    messageLayout: {
      stacked: {},
      status: {
        root: { gap: "0.6rem" },
        description: { fontSize: "0.8rem", lineHeight: 1.4, minHeight: "1.4em" },
        error: {
          fontSize: "0.8rem",
          lineHeight: 1.4,
          minHeight: "1.4em",
          fontWeight: "bold",
        },
      },
    },
    messageAlign: {
      start: {},
      center: { description: { textAlign: "center" }, error: { textAlign: "center" } },
    },
    labelVisibility: {
      visible: {},
      hidden: {
        label: {
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        },
      },
    },
  },
  base: {
    root: { display: "flex", flexDirection: "column", gap: "3", minWidth: 0 },
    label: { textStyle: "label", color: "fg.default" },
    control: { minWidth: 0 },
    description: { textStyle: "body.sm", color: "fg.muted" },
    error: { textStyle: "body.sm", color: "status.danger.fg" },
  },
});
