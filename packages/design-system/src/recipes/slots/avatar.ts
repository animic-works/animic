import { focus } from "../control";
import { defineSlotRecipe } from "@pandacss/dev";
export const avatar = defineSlotRecipe({
  className: "avatar",
  slots: ["indicator", "trigger", "frame", "root", "image", "fallback", "badge"],
  base: {
    indicator: {
      position: "absolute",
      insetInlineStart: "-2px",
      insetBlockEnd: "0",
      display: "grid",
      placeItems: "center",
      width: "1.8rem",
      height: "1.8rem",
      borderRadius: "full",
      border: "2px solid token(colors.bg.surface)",
      background: "bg.inverse",
      color: "fg.inverse",
      "& > svg": { width: "1rem", height: "1rem" },
    },
    trigger: {
      position: "relative",
      display: "inline-flex",
      padding: "0",
      border: "0",
      background: "transparent",
      borderRadius: "full",
      flexShrink: 0,
      cursor: "pointer",
      _focusVisible: focus,
      _pressed: {
        boxShadow: "0 0 0 3px token(colors.bg.surface), 0 0 0 6px token(colors.accent.primary)",
        "@media (forced-colors: active)": {
          _after: {
            content: '""',
            position: "absolute",
            inset: "-6px",
            border: "3px solid Highlight",
            borderRadius: "inherit",
            pointerEvents: "none",
          },
        },
      },
      _disabled: { cursor: "not-allowed", opacity: "0.5" },
    },
    frame: { position: "relative", display: "inline-flex", flexShrink: 0 },
    root: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "3.3rem",
      height: "3.3rem",
      borderRadius: "full",
      overflow: "hidden",
      background: "bg.subtle",
      color: "fg.default",
      flexShrink: 0,
    },
    image: { width: "100%", height: "100%", objectFit: "cover" },
    fallback: { textStyle: "display.title" },
    badge: {
      position: "absolute",
      insetInlineEnd: "-2px",
      insetBlockEnd: "-2px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "icon.1",
      height: "icon.1",
      borderRadius: "full",
      background: "bg.surface",
      borderColor: "border.default",
      borderWidth: "1",
      borderStyle: "solid",
      "& > svg": { width: "icon.0", height: "icon.0" },
    },
  },
  variants: {
    status: {
      idle: {
        badge: {
          width: "0.55rem",
          height: "0.55rem",
          background: "fg.subtle",
          borderColor: "bg.surface",
        },
      },
      busy: {
        root: {
          animation: "activityPulse 1600ms ease-in-out infinite",
          _motionReduce: { animation: "none" },
        },
        badge: {
          width: "0.55rem",
          height: "0.55rem",
          background: "accent.secondary",
          borderColor: "bg.surface",
        },
      },
      complete: {
        badge: { background: "status.success.fg", color: "fg.inverse", borderColor: "bg.surface" },
      },
      pending: { root: { opacity: "0.45" }, badge: { display: "none" } },
    },
    size: {
      fill: {
        trigger: { width: "100%", aspectRatio: "1" },
        frame: { width: "100%", aspectRatio: "1" },
        root: { width: "100%", height: "auto", aspectRatio: "1" },
      },
      fluid: {
        root: { width: "clamp(4rem, 8vw, 5.5rem)", height: "clamp(4rem, 8vw, 5.5rem)" },
        fallback: { fontSize: "clamp(1.8rem, 4vw, 2.4rem)" },
      },
      small: {
        root: { width: "2rem", height: "2rem" },
        fallback: { fontSize: "1" },
      },
      large: { root: { width: "5.5rem", height: "5.5rem" }, fallback: { fontSize: "5" } },
      standard: {},
      compact: { root: { width: "2.5rem", height: "2.5rem" } },
      // トップのメニューのアカウント。狭い画面では隣の操作との間を空けるため、一回り小さくする。
      navigation: {
        root: {
          width: "2.5rem",
          height: "2.5rem",
          _navigationCompact: { width: "2.125rem", height: "2.125rem" },
          _navigationNarrow: { width: "1.875rem", height: "1.875rem" },
        },
        fallback: { _navigationCompact: { fontSize: "2" } },
      },
    },
    ring: {
      true: {
        root: { boxShadow: "0 0 0 2px token(colors.bg.surface), 0 0 0 4px token(colors.pink.1)" },
      },
      false: {},
    },
    palette: {
      brand: {
        root: {
          background: "linear-gradient(135deg, token(colors.pink.1), token(colors.accent.primary))",
          color: "fg.inverse",
        },
      },
      pink: { root: { background: "avatar.pink.bg", color: "avatar.pink.fg" } },
      cyan: { root: { background: "avatar.cyan.bg", color: "avatar.cyan.fg" } },
      yellow: { root: { background: "avatar.yellow.bg", color: "avatar.yellow.fg" } },
      rose: { root: { background: "avatar.rose.bg", color: "avatar.rose.fg" } },
      sky: { root: { background: "avatar.sky.bg", color: "avatar.sky.fg" } },
      cream: { root: { background: "avatar.cream.bg", color: "avatar.cream.fg" } },
      gray: { root: { background: "avatar.gray.bg", color: "avatar.gray.fg" } },
      green: { root: { background: "avatar.green.bg", color: "avatar.green.fg" } },
      violet: { root: { background: "avatar.violet.bg", color: "avatar.violet.fg" } },
      orange: { root: { background: "avatar.orange.bg", color: "avatar.orange.fg" } },
      ink: { root: { background: "avatar.ink.bg", color: "avatar.ink.fg" } },
    },
  },
  compoundVariants: [
    // Discordでログインした人の既定の色。輪もアバターの色にそろえる。
    {
      palette: "violet",
      ring: true,
      css: {
        root: {
          boxShadow: "0 0 0 2px token(colors.bg.surface), 0 0 0 4px token(colors.avatar.violet.bg)",
        },
      },
    },
  ],
  defaultVariants: { size: "standard" },
});
