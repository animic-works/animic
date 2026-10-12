import { defineSlotRecipe } from "@pandacss/dev";

export const notice = defineSlotRecipe({
  className: "notice",
  slots: ["root", "icon", "body", "title", "description", "actions"],
  base: {
    root: {
      "--animic-notice-icon-size": "2.6rem",
      "--animic-notice-gap": "0.9rem",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "var(--animic-notice-gap)",
      width: "100%",
      maxWidth: "44rem",
      minWidth: 0,
      marginInline: "auto",
      containerType: "inline-size",
      containerName: "animic-notice",
      padding: "0.85rem 0.9rem 0.85rem 1rem",
      borderRadius: "1.2rem",
      border:
        "2px dashed color-mix(in srgb, token(colors.accent.primary) 35%, token(colors.bg.surface))",
      background: "color-mix(in srgb, token(colors.accent.primary) 3%, token(colors.bg.surface))",
    },
    icon: {
      display: "grid",
      placeItems: "center",
      flex: "none",
      width: "var(--animic-notice-icon-size)",
      height: "var(--animic-notice-icon-size)",
      borderRadius: "full",
      background: "bg.surface",
      color: "accent.primary",
      boxShadow:
        "inset 0 0 0 2px color-mix(in srgb, token(colors.accent.primary) 22%, token(colors.bg.surface))",
    },
    body: {
      flex: "1 1 min(14rem, calc(100% - var(--animic-notice-icon-size) - var(--animic-notice-gap)))",
      minWidth: 0,
      display: "grid",
      gap: "0.15rem",
    },
    title: { textStyle: "label.name", color: "fg.default" },
    description: { textStyle: "body.sm", color: "fg.supporting" },
    actions: {
      flex: "0 0 auto",
      maxWidth: "100%",
      _noticeCompact: { flexBasis: "100%" },
      "& > *": { width: "100%" },
    },
  },
  variants: {
    tone: {
      primary: {},
      neutral: {
        root: { background: "bg.subtle", borderWidth: "0" },
        icon: { boxShadow: "none" },
      },
      danger: {
        root: {
          borderWidth: "0",
          background:
            "color-mix(in srgb, token(colors.status.danger.fg) 8%, token(colors.bg.surface))",
        },
        title: { color: "status.danger.fg", textAlign: "center" },
        description: { color: "status.danger.fg", fontWeight: "bold", textAlign: "center" },
        icon: { color: "status.danger.fg", boxShadow: "none" },
      },
      success: {
        root: {
          borderStyle: "solid",
          borderColor:
            "color-mix(in srgb, token(colors.status.success.fg) 25%, token(colors.bg.surface))",
          background:
            "color-mix(in srgb, token(colors.status.success.fg) 5%, token(colors.bg.surface))",
        },
        icon: { background: "status.success.fg", color: "fg.inverse", boxShadow: "none" },
      },
    },
    density: {
      normal: {},
      compact: {
        root: {
          padding: "0.6rem 0.8rem",
          borderRadius: "0.9rem",
          "--animic-notice-icon-size": "2.2rem",
          "--animic-notice-gap": "0.75rem",
        },
        title: { textStyle: "label.supporting" },
        description: { textStyle: "caption" },
      },
    },
  },
  compoundVariants: [
    {
      tone: "danger",
      density: "compact",
      css: {
        root: { padding: "0.6rem 0.9rem", borderRadius: "0.8rem" },
        description: { fontSize: "0.85rem", fontWeight: "bold" },
      },
    },
  ],
});
