import { defineSlotRecipe } from "@pandacss/dev";

export const appFrame = defineSlotRecipe({
  className: "app-frame",
  slots: [
    "root",
    "header",
    "brand",
    "context",
    "actions",
    "compactContext",
    "compactActions",
    "progress",
    "main",
    "footer",
    "wideContent",
  ],
  base: {
    wideContent: { _appFrameCompact: { display: "none" } },
    compactContext: {
      display: "none",
      minWidth: 0,
      justifySelf: "center",
      _appFrameCompact: { display: "block" },
    },
    compactActions: {
      display: "none",
      alignItems: "center",
      gap: "2",
      _appFrameCompact: { display: "flex" },
    },
    progress: {
      height: "0.375rem",
      background:
        "linear-gradient(90deg, token(colors.accent.secondary), token(colors.accent.primary))",
    },
    root: { minHeight: "100svh", "--animic-app-frame-content-width": "72rem" },
    header: {
      position: "relative",
      zIndex: "navigation",
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr) auto",
      alignItems: "center",
      gap: "4",
      padding: "0.85rem 2rem",
      minHeight: "4.5rem",
      _appFrameCompact: {
        position: "sticky",
        top: "0",
        minHeight: "calc(3.5rem + env(safe-area-inset-top, 0px))",
        padding: "env(safe-area-inset-top, 0px) 1rem 0",
        gap: "2",
        background: "color-mix(in srgb, token(colors.bg.surface) 94%, transparent)",
        borderBottom: "1px solid token(colors.border.default)",
        backdropFilter: "blur(10px)",
      },
    },
    brand: {
      minWidth: 0,
      "& img": {
        display: "block",
        width: "7rem",
        height: "auto",
        _appFrameCompact: { width: "5.6rem" },
      },
    },
    context: { minWidth: 0, justifySelf: "start" },
    actions: { display: "flex", alignItems: "center", gap: "3" },
    main: {
      width: "100%",
      maxWidth: "var(--animic-app-frame-content-width)",
      marginInline: "auto",
      padding: "1rem 1rem 3rem",
      _appFrameCompact: { paddingBlockStart: "3" },
    },
    footer: { paddingBlock: "6", textAlign: "center" },
  },
  variants: {
    brandOnly: {
      true: {
        root: {
          _appFrameBrandBeside: {
            display: "grid",
            gridTemplateColumns:
              "minmax(9rem, 1fr) minmax(0, var(--animic-app-frame-content-width)) minmax(9rem, 1fr)",
            alignContent: "start",
          },
        },
        header: {
          _appFrameBrandBeside: {
            gridColumn: "1",
            gridRow: "1",
            alignSelf: "start",
            gridTemplateColumns: "minmax(0, 1fr)",
            paddingInlineEnd: "0",
          },
        },
        context: { _appFrameBrandBeside: { display: "none" } },
        actions: { _appFrameBrandBeside: { display: "none" } },
        main: { _appFrameBrandBeside: { gridColumn: "2", gridRow: "1" } },
        footer: { _appFrameBrandBeside: { gridColumn: "1 / -1" } },
      },
    },
    compactControls: {
      true: {
        context: { _appFrameCompact: { display: "none" } },
        actions: { _appFrameCompact: { display: "none" } },
      },
      false: {
        compactContext: { display: "none", _appFrameCompact: { display: "none" } },
        compactActions: { display: "none", _appFrameCompact: { display: "none" } },
      },
    },
    width: {
      content: { root: { "--animic-app-frame-content-width": "62rem" } },
      reading: { root: { "--animic-app-frame-content-width": "52rem" } },
      wide: {},
      full: { main: { maxWidth: "none" } },
    },
    bottomAction: {
      true: {
        main: {
          _actionBarDocked: { paddingBottom: "calc(8rem + env(safe-area-inset-bottom, 0px))" },
        },
      },
    },
  },
});
