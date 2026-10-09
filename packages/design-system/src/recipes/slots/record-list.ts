import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const recordList = defineSlotRecipe({
  className: "record-list",
  slots: ["root", "row", "leading", "image", "avatar", "body", "supplement", "value"],
  base: {
    root: { display: "grid", gap: "3", listStyle: "none", margin: "0", padding: "0" },
    row: {
      display: "flex",
      alignItems: "center",
      gap: "5",
      padding: "0.6rem 1.2rem 0.6rem 0.6rem",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1.25rem",
      background: "bg.surface",
      color: "fg.default",
      minWidth: 0,
      textDecoration: "none",
      _focusVisible: focus,
      "&[href]:hover": { borderColor: "accent.primary" },
      _recordCompact: { gap: "3", padding: "0.6rem 0.75rem" },
    },
    leading: { flexShrink: 0, minWidth: "2rem", textAlign: "center" },
    avatar: { flexShrink: 0, display: "flex", alignItems: "center" },
    image: {
      flexShrink: 0,
      width: "3.4rem",
      height: "5rem",
      borderRadius: "0.65rem",
      overflow: "hidden",
      background: "bg.subtle",
      "& > img": { width: "100%", height: "100%", objectFit: "cover" },
      _recordCompact: { width: "2.5rem", height: "3rem" },
    },
    body: { flex: "1 1 auto", minWidth: 0, display: "grid", gap: "1" },
    supplement: { width: "12rem", minWidth: 0, _recordCompact: { display: "none" } },
    value: { flexShrink: 0, textAlign: "end" },
  },
  variants: {
    entering: {
      true: {
        root: {
          "& > li": {
            animation: "itemRise 600ms cubic-bezier(.2,.9,.3,1) both",
            _motionReduce: { animation: "none" },
          },
        },
      },
    },
    layout: {
      list: {},
      grid: { root: { gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))" } },
    },
    imagePosition: { start: { image: { order: -1 } }, "after-leading": {} },
    emphasis: {
      true: {
        row: {
          borderColor: "accent.primary",
          background:
            "color-mix(in srgb, token(colors.accent.primary) 4%, token(colors.bg.surface))",
        },
      },
    },
    density: {
      comfortable: {},
      compact: {
        row: {
          padding: "0.55rem 1rem 0.55rem 0.7rem",
          gap: "0.8rem",
          borderRadius: "1rem",
          _recordCompact: { gap: "0.5rem", padding: "0.5rem 0.6rem" },
        },
        leading: { minWidth: "2.4rem", _recordCompact: { minWidth: "1.25rem" } },
        image: {
          width: "2.6rem",
          height: "auto",
          aspectRatio: "13 / 19",
          borderRadius: "0.45rem",
          _recordCompact: { width: "2.2rem" },
        },
      },
    },
  },
});
