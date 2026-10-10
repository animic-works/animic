import { defineSlotRecipe } from "@pandacss/dev";

export const meter = defineSlotRecipe({
  className: "meter",
  slots: ["root", "description", "heading", "label", "value", "track", "fill"],
  base: {
    description: { display: "block", textStyle: "caption", color: "fg.supporting" },
    root: { display: "grid", gap: "3", minWidth: 0 },
    heading: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "3",
    },
    label: { textStyle: "label", color: "fg.default" },
    value: {
      textStyle: "numeric.display",
      fontSize: "1.9rem",
      _headingCompact: { fontSize: "1.5rem" },
      color: "fg.default",
      "& > small": { fontSize: "0.5em" },
    },
    track: { height: "0.5rem", borderRadius: "full", overflow: "hidden", background: "bg.subtle" },
    fill: {
      height: "100%",
      width: "var(--animic-meter-value)",
      borderRadius: "inherit",
      transition: "width 500ms cubic-bezier(0.2, 0.9, 0.3, 1)",
      _motionReduce: { transition: "none" },
      backgroundImage:
        "linear-gradient(90deg, token(colors.accent.secondary), token(colors.accent.primary))",
    },
  },
  variants: {
    appearance: {
      standard: {},
      inverse: {
        label: { color: "fg.inverse" },
        value: { color: "fg.inverse" },
        description: {
          color: "color-mix(in srgb, token(colors.fg.inverse) 60%, token(colors.bg.inverse))",
          fontSize: "0.56rem",
        },
        track: { background: "color-mix(in srgb, token(colors.fg.inverse) 15%, transparent)" },
      },
    },
    tone: {
      gradient: {},
      primary: { fill: { background: "accent.primary" } },
      secondary: { fill: { background: "accent.secondary" } },
      highlight: { fill: { background: "accent.highlight" } },
      success: { fill: { background: "status.success.fg" } },
    },
    presentation: {
      row: {
        root: {
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(2rem, 1fr) 3rem",
          alignItems: "center",
          gap: "3",
        },
        heading: { display: "contents" },
        label: { gridColumn: "1", gridRow: "1", textStyle: "caption", fontWeight: "bold" },
        value: { gridColumn: "3", gridRow: "1", textStyle: "code.compact", textAlign: "end" },
        track: { gridColumn: "2", gridRow: "1", height: "0.375rem" },
      },
      labeled: {},
      track: {
        heading: {
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
});
