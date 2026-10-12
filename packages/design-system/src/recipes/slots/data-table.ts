import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";

export const dataTable = defineSlotRecipe({
  className: "data-table",
  slots: ["viewport", "table", "heading", "cell", "rowHeading", "empty"],
  base: {
    viewport: {
      minWidth: "0",
      maxWidth: "100%",
      overflow: "auto",
      borderWidth: "1",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "2",
      background: "bg.surface",
      _focusVisible: { ...focus, outlineOffset: "-2px" },
    },
    table: {
      width: "max-content",
      minWidth: "100%",
      borderCollapse: "collapse",
      textStyle: "body.sm",
      color: "fg.default",
    },
    heading: {
      paddingBlock: "3",
      paddingInline: "4",
      textStyle: "label",
      textAlign: "start",
      whiteSpace: "nowrap",
      background: "bg.subtle",
      borderBottom: "1px solid token(colors.border.strong)",
    },
    cell: {
      paddingBlock: "3",
      paddingInline: "4",
      maxWidth: "24rem",
      verticalAlign: "top",
      textAlign: "start",
      overflowWrap: "anywhere",
      borderBottom: "1px solid token(colors.border.default)",
      "tr:last-child &": { borderBottom: "0" },
    },
    rowHeading: { fontWeight: "bold" },
    empty: { padding: "5", color: "fg.muted", textAlign: "center" },
  },
});
