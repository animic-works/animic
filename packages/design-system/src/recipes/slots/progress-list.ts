import { defineSlotRecipe } from "@pandacss/dev";
export const progressList = defineSlotRecipe({
  className: "progress-list",
  slots: ["root", "group", "heading", "groupValue", "items", "item", "indicator", "label", "value"],
  base: {
    root: { display: "grid", gap: "2" },
    group: { display: "grid", gap: "1", minWidth: 0 },
    heading: {
      display: "flex",
      justifyContent: "space-between",
      gap: "2",
      paddingInline: "1",
      textStyle: "caption",
      color: "fg.supporting",
    },
    groupValue: {
      textStyle: "numeric.supporting",
      fontSize: "0.85rem",
      "&[data-complete]": { color: "accent.primary" },
    },
    items: {
      display: "grid",
      gap: "1",
      listStyle: "none",
      margin: "0",
      padding: "0",
      _progressListCompact: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    },
    item: {
      display: "grid",
      gridTemplateColumns: "1.4rem minmax(0, 1fr) auto",
      alignItems: "center",
      gap: "2",
      padding: "0.22rem 0.6rem",
      borderRadius: "0.75rem",
      background: "bg.subtle",
      color: "fg.muted",
      _progressListCompact: {
        gridTemplateColumns: "1.4rem minmax(0, 1fr)",
        gap: "1",
        padding: "0.35rem 0.45rem",
      },
    },
    label: { minWidth: 0, overflowWrap: "anywhere", textStyle: "code.compact" },
    value: {
      textStyle: "code.compact",
      whiteSpace: "nowrap",
      _progressListCompact: { gridColumn: "2" },
    },
    indicator: {
      display: "grid",
      placeItems: "center",
      width: "1.4rem",
      height: "1.4rem",
      borderRadius: "full",
      background: "disabled.bg",
      "& > svg": { display: "block", width: "100%", height: "100%" },
    },
  },
  variants: {
    state: {
      pending: {},
      active: {
        item: {
          color: "fg.default",
          background: "bg.surface",
          boxShadow:
            "inset 0 0 0 1.5px token(colors.accent.secondary), 0 8px 18px -12px color-mix(in srgb, token(colors.accent.secondary) 80%, transparent)",
        },
        indicator: { color: "accent.secondary", background: "transparent" },
      },
      complete: {
        item: {
          background: "bg.surface",
          color: "fg.default",
          boxShadow: "inset 0 0 0 1.5px token(colors.border.default)",
        },
        indicator: { background: "bg.inverse", color: "fg.inverse" },
      },
    },
  },
});
