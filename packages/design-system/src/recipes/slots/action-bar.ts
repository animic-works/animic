import { defineSlotRecipe } from "@pandacss/dev";
export const actionBar = defineSlotRecipe({
  className: "action-bar",
  slots: ["root", "summary", "actions"],
  base: {
    root: {
      display: "grid",
      gap: "3",
      minWidth: 0,
      paddingBlockStart: "5",
      borderTop: "2px dashed token(colors.border.default)",
      _actionBarDocked: {
        position: "fixed",
        zIndex: "navigation",
        insetInline: "0",
        bottom: "0",
        gridTemplateColumns: "minmax(0, 1fr)",
        alignItems: "center",
        gap: "3",
        padding: "0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom, 0px))",
        borderTop: "0",
        borderRadius: "1.25rem 1.25rem 0 0",
        background: "bg.surface",
        boxShadow: "0 -10px 30px -18px rgb(11 27 43 / 0.4)",
      },
    },
    summary: {
      display: "none",
      _actionBarCompact: {
        display: "grid",
        justifyItems: "center",
        gap: "0",
        minWidth: "4.5rem",
        padding: "0.35rem 0.7rem",
        borderRadius: "0.875rem",
        background: "bg.subtle",
      },
    },
    actions: { display: "grid", gap: "2", minWidth: 0 },
  },
  variants: {
    summary: {
      false: {},
      true: { root: { _actionBarCompact: { gridTemplateColumns: "auto minmax(0, 1fr)" } } },
    },
    tone: {
      neutral: {},
      success: { summary: { _actionBarCompact: { background: "status.success.bg" } } },
    },
  },
});
