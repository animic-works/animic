import { defineSlotRecipe } from "@pandacss/dev";

import { focus } from "../control";

export const outputPanel = defineSlotRecipe({
  className: "output-panel",
  slots: [
    "root",
    "heading",
    "title",
    "value",
    "body",
    "group",
    "groups",
    "label",
    "tags",
    "tag",
    "confidence",
  ],
  base: {
    root: {
      minWidth: 0,
      padding: "3",
      borderRadius: "0.9rem",
      background: "bg.inverse",
      color: "fg.inverse",
      display: "grid",
      gap: "2",
    },
    heading: { display: "flex", alignItems: "baseline", gap: "2", textStyle: "code.compact" },
    title: { color: "accent.secondary", overflowWrap: "anywhere" },
    value: { marginInlineStart: "auto", whiteSpace: "nowrap" },
    body: {
      minWidth: 0,
      maxHeight: "8.5rem",
      overflow: "auto",
      overscrollBehavior: "contain",
      _focusVisible: { ...focus, outlineColor: "fg.inverse", outlineOffset: "-2px" },
    },
    groups: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))",
      gap: "2",
      alignItems: "start",
    },
    group: { minWidth: 0, display: "grid", alignContent: "start", gap: "1" },
    label: {
      textStyle: "caption",
      color: "color-mix(in srgb, token(colors.fg.inverse) 65%, token(colors.bg.inverse))",
    },
    tags: {
      display: "flex",
      flexWrap: "wrap",
      alignContent: "start",
      gap: "1",
      listStyle: "none",
      margin: "0",
      padding: "0",
    },
    tag: {
      display: "inline-flex",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: "1",
      padding: "0.1rem 0.4rem",
      borderRadius: "0.35rem",
      textStyle: "code.compact",
      fontSize: "0.62rem",
      overflowWrap: "anywhere",
      background: "color-mix(in srgb, token(colors.fg.inverse) 8%, transparent)",
      color: "color-mix(in srgb, token(colors.fg.inverse) 80%, token(colors.bg.inverse))",
      "&[data-highlighted]": {
        background: "color-mix(in srgb, token(colors.status.success.fg) 22%, transparent)",
        color: "color-mix(in srgb, token(colors.status.success.fg) 50%, token(colors.fg.inverse))",
      },
    },
    confidence: { opacity: "0.7" },
  },
});
