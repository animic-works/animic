import { defineSlotRecipe } from "@pandacss/dev";

export const layoutHeader = defineSlotRecipe({
  className: "layout-header",
  slots: ["root", "back", "compactBack", "title"],
  base: {
    root: {
      position: "absolute",
      insetBlockStart: "6",
      insetInlineStart: "clamp(1rem, 4vw, 3rem)",
      zIndex: "navigation",
      _layoutHeaderCompact: {
        insetBlockStart: "0",
        insetInline: "0",
        display: "grid",
        gridTemplateColumns: "3rem minmax(0, 1fr) 3rem",
        alignItems: "center",
        minHeight: "calc(3.5rem + env(safe-area-inset-top, 0px))",
        padding: "env(safe-area-inset-top, 0px) 0.5rem 0",
      },
    },
    back: { display: "flex", alignItems: "center" },
    compactBack: { display: "none", _layoutHeaderCompact: { display: "flex" } },
    title: {
      display: "none",
      _layoutHeaderCompact: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "0",
        textAlign: "center",
        textStyle: "heading.sm",
      },
    },
  },
  variants: {
    compactBack: { true: { back: { _layoutHeaderCompact: { display: "none" } } } },
    compactPresentation: {
      overlay: {},
      bar: {
        root: {
          _layoutHeaderCompact: {
            position: "sticky",
            background: "color-mix(in srgb, token(colors.bg.surface) 94%, transparent)",
            boxShadow: "inset 0 -1px token(colors.border.default)",
            backdropFilter: "blur(10px)",
          },
        },
      },
    },
  },
});
