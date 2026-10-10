import { defineSlotRecipe } from "@pandacss/dev";
export const comparisonStage = defineSlotRecipe({
  className: "comparison-stage",
  slots: ["root", "layout", "first", "body", "second"],
  base: {
    root: {
      width: "100%",
      minWidth: 0,
      containerType: "inline-size",
      containerName: "animic-comparison-stage",
    },
    layout: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(19rem, 25rem) minmax(0, 1fr)",
      alignItems: "center",
      gap: "clamp(1rem, 2.4vw, 2.5rem)",
      maxWidth: "84rem",
      marginInline: "auto",
      minHeight: "max(34rem, calc(100svh - 13.5rem))",
      padding: "1.5rem 1rem 1rem",
      _comparisonStageCompact: {
        height: "auto",
        minHeight: "0",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "4",
        padding: "3",
      },
    },
    first: {
      minWidth: 0,
      width: "min(100%, max(10rem, calc((100svh - 22rem) * 13 / 19)))",
      justifySelf: "center",
      _comparisonStageCompact: {
        width: "min(100%, max(8rem, calc(31svh * 13 / 19)))",
        gridArea: "1 / 1",
      },
    },
    second: {
      minWidth: 0,
      width: "min(100%, max(10rem, calc((100svh - 22rem) * 13 / 19)))",
      justifySelf: "center",
      _comparisonStageCompact: {
        width: "min(100%, max(8rem, calc(31svh * 13 / 19)))",
        gridArea: "1 / 2",
      },
    },
    body: { minWidth: 0, _comparisonStageCompact: { gridColumn: "1 / -1", gridRow: "2" } },
  },
});
