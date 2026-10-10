import { defineSlotRecipe } from "@pandacss/dev";
export const composer = defineSlotRecipe({
  className: "composer",
  slots: [
    "root",
    "header",
    "title",
    "eyebrow",
    "controls",
    "tabs",
    "input",
    "tools",
    "footer",
    "summary",
    "action",
  ],
  base: {
    root: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateRows: "auto auto minmax(8rem, 1fr) auto auto",
      gap: "3",
      minHeight: 0,
      minWidth: 0,
    },
    header: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "3",
    },
    title: { minWidth: 0 },
    eyebrow: {
      textStyle: "eyebrow.strong",
      color: "accent.primary",
      _composerCompact: { display: "none" },
    },
    controls: { flexShrink: 0, maxWidth: "100%" },
    tabs: { minWidth: 0 },
    input: { minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" },
    tools: {
      display: "grid",
      gap: "2",
      _composerCompact: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    },
    footer: {
      display: "grid",
      gap: "3",
      _composerCompact: {
        gridTemplateColumns: "minmax(0, 5.5rem) minmax(0, 1fr)",
        alignItems: "center",
        gap: "4",
      },
    },
    summary: { minWidth: 0 },
    action: { display: "grid", minWidth: 0 },
  },
});
