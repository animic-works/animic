import { defineSlotRecipe, defineStyles } from "@pandacss/dev";
// 開いた後は演出の終点を残さず、通常の描画に戻す。閉じるときは消えた状態を保つ。
// 演出はreduced motionでない場合だけ指定し、後から重ねる指定との出力順に左右されないようにする。
const fadePresence = defineStyles({
  animationDuration: "1",
  animationTimingFunction: "standard",
  animationFillMode: "both",
  _motionSafe: {
    _open: { animationName: "fadeIn", animationFillMode: "backwards" },
    _closed: { animationName: "fadeOut" },
  },
});
const contentPresence = defineStyles({
  ...fadePresence,
  _motionSafe: {
    _open: { animationName: "dialogEnter", animationDuration: "2", animationFillMode: "backwards" },
    _closed: { animationName: "fadeOut" },
  },
});
const centered = defineStyles({
  alignSelf: "center",
  width: "calc(100% - 2 * token(spacing.5))",
  maxWidth: "var(--animic-dialog-width, 50rem)",
  maxHeight: "calc(100dvh - 2 * token(spacing.5))",
  borderRadius: "var(--animic-dialog-radius, token(radii.3))",
});
const centeredHeading = {
  content: defineStyles({
    "--animic-dialog-title-start":
      "var(--animic-dialog-close-space, calc(token(sizes.control.0) + token(spacing.3)))",
  }),
  title: defineStyles({ textAlign: "center" }),
  description: defineStyles({ textAlign: "center" }),
};
export const dialog = defineSlotRecipe({
  className: "dialog",
  slots: [
    "scrim",
    "positioner",
    "content",
    "title",
    "description",
    "body",
    "close",
    "header",
    "headerActions",
    "headerMedia",
    "footer",
  ],
  base: {
    headerMedia: {
      display: "grid",
      placeItems: "center",
      minWidth: 0,
      marginBlockEnd: "5",
      paddingBlockStart:
        "max(0px, calc(token(sizes.control.0) + token(spacing.5) + token(spacing.3) - var(--animic-dialog-header-inset, var(--animic-dialog-padding, token(spacing.6)))))",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "4",
      flexWrap: "wrap",
      paddingInlineEnd:
        "var(--animic-dialog-close-space, calc(token(sizes.control.0) + token(spacing.3)))",
    },
    headerActions: { flex: "1 1 15rem", minWidth: 0 },
    footer: {
      marginTop: "5",
      paddingTop: "4",
      borderTop: "1px solid token(colors.border.default)",
    },
    scrim: {
      position: "fixed",
      inset: 0,
      zIndex: "overlay",
      layerStyle: "overlay.scrim",
      ...fadePresence,
      backdropFilter: "blur(3px)",
    },
    positioner: {
      position: "fixed",
      inset: 0,
      zIndex: "overlay",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      containerType: "inline-size",
      containerName: "animic-dialog",
      fontSize: "2",
    },
    content: {
      ...contentPresence,
      // ダイアログ内ではアクションの装飾用の外縁・影を共通で抑える。
      "--animic-button-decoration-shadow": "none",
      boxSizing: "border-box",
      layerStyle: "surface.floating",
      borderRadius: "var(--animic-dialog-radius, token(radii.3))",
      borderEndStartRadius: "0",
      borderEndEndRadius: "0",
      padding: "var(--animic-dialog-padding, token(spacing.6))",
      width: "100%",
      maxHeight: "calc(100dvh - token(spacing.5))",
      overflowY: "auto",
      position: "relative",
      color: "fg.default",
      fontSynthesis: "none",
      "& *, &::before, &::after, & *::before, & *::after": {
        boxSizing: "border-box",
      },
    },
    title: {
      textStyle: "heading.md",
      flex: "1 1 auto",
      margin: "0",
      paddingInlineStart: "var(--animic-dialog-title-start, 0px)",
      overflowWrap: "anywhere",
    },
    description: {
      textStyle: "body.md",
      marginBlockStart: "3",
      marginBlockEnd: "0",
      color: "fg.muted",
    },
    body: {
      marginBlockStart: "6",
      minWidth: 0,
      "&:first-child, [data-part=title] + &": { marginBlockStart: "0" },
    },
    close: { position: "absolute", insetBlockStart: "5", insetInlineEnd: "5" },
  },
  variants: {
    headerMedia: {
      true: {
        content: { "--animic-dialog-close-space": "0px", "--animic-dialog-title-start": "0px" },
      },
      false: {},
    },
    appearance: {
      surface: {},
      transparent: {
        scrim: {
          background: "transparent",
          backdropFilter: "none",
          _open: { animation: "none" },
          _closed: { animation: "none" },
        },
        content: {
          background: "transparent",
          boxShadow: "none",
          _open: { animation: "none" },
          _closed: { animation: "none" },
        },
      },
      immersive: {
        scrim: {
          background: "color-mix(in srgb, token(colors.bg.inverse) 88%, transparent)",
          backdropFilter: "blur(3px)",
        },
        content: {
          background: "transparent",
          boxShadow: "none",
          color: "fg.inverse",
        },
        title: { color: "fg.inverse" },
        description: { color: "fg.inverse" },
      },
    },
    closeButton: {
      true: {},
      false: {
        content: { "--animic-dialog-close-space": "0px" },
        headerMedia: { paddingBlockStart: "0" },
      },
    },
    titleVisibility: {
      hidden: {
        title: {
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        },
      },
      visible: {},
    },
    size: {
      expanded: {
        content: {
          "--animic-dialog-width": "75rem",
          "--animic-dialog-radius": "1.5rem",
          "--animic-dialog-padding": "0px",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          overflow: "hidden",
          height: "min(85dvh, 48rem)",
          alignSelf: "center",
        },
        header: {
          paddingBlock: "1rem",
          paddingInlineStart: "1.25rem",
          paddingInlineEnd:
            "calc(1.25rem + var(--animic-dialog-close-space, calc(token(sizes.control.0) + token(spacing.3))))",
        },
        title: { textStyle: "heading.panel", paddingRight: "0" },
        body: {
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "hidden",
          marginTop: "0",
          borderTop: "1px solid token(colors.border.default)",
        },
        footer: {
          marginTop: "0",
          padding: "0.75rem 1.25rem max(0.75rem, env(safe-area-inset-bottom))",
        },
      },
      standard: {},
      compact: {
        title: { textStyle: "heading.dialog" },
        description: { textStyle: "body.sm" },
        body: { marginBlockStart: "5" },
        content: {
          "--animic-dialog-width": "25rem",
          "--animic-dialog-radius": "1.75rem",
          "--animic-dialog-padding": "clamp(1.5rem, 5vw, 2.25rem)",
        },
      },
    },
    titleAlign: {
      auto: {},
      start: {
        title: { textAlign: "start" },
        description: { textAlign: "start" },
      },
      center: centeredHeading,
    },
    presentation: {
      adaptive: {},
      centered: { content: centered },
      fullscreen: {
        content: {
          "--animic-dialog-header-inset": "0px",
          alignSelf: "stretch",
          width: "100%",
          maxWidth: "none",
          height: "100%",
          maxHeight: "none",
          borderRadius: "0",
          padding: "0",
          overflowX: "hidden",
          overflowY: "auto",
        },
        body: { marginBlockStart: "0", height: "100%" },
        footer: {
          position: "absolute",
          insetInline: "0",
          bottom: "calc(clamp(1.5rem, 5vh, 2.5rem) + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          justifyContent: "center",
          margin: "0",
          padding: "0",
          border: "0",
        },
      },
    },
  },
  compoundVariants: [
    { size: "compact", titleAlign: "auto", css: centeredHeading },
    { appearance: "immersive", titleAlign: "auto", css: centeredHeading },
    {
      size: "standard",
      presentation: "adaptive",
      css: { content: { _dialogCentered: centered } },
    },
    {
      size: "expanded",
      presentation: ["adaptive", "centered"],
      css: {
        content: {
          width: "min(95vw, 75rem)",
          maxWidth: "75rem",
          maxHeight: "85dvh",
          borderRadius: "1.5rem",
          _dialogExpandedCompact: {
            width: "100%",
            maxWidth: "none",
            maxHeight: "100dvh",
            height: "100dvh",
            borderRadius: "0",
          },
        },
      },
    },
    { size: "compact", appearance: "surface", css: { description: { color: "fg.supporting" } } },
    {
      size: "compact",
      presentation: "adaptive",
      css: {
        content: {
          "--animic-dialog-header-inset": "0.75rem",
          padding: "0.75rem 1rem max(1rem, env(safe-area-inset-bottom))",
          _open: {
            animation: "sheetEnter 350ms cubic-bezier(0.2, 0.9, 0.3, 1)",
            _motionReduce: { animation: "none" },
          },
          _dialogCompactCentered: {
            ...centered,
            "--animic-dialog-header-inset": "var(--animic-dialog-padding)",
            padding: "var(--animic-dialog-padding)",
            ...contentPresence,
          },
          "&::before": {
            content: '""',
            display: "block",
            width: "2.5rem",
            height: "5px",
            marginInline: "auto",
            marginBlockEnd: "6",
            borderRadius: "full",
            background: "border.default",
            _dialogCompactCentered: { display: "none" },
          },
        },
      },
    },
  ],
  defaultVariants: {
    appearance: "surface",
    presentation: "adaptive",
    size: "standard",
    titleAlign: "auto",
  },
});
