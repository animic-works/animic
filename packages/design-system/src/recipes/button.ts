import { defineRecipe } from "@pandacss/dev";
import { buttonFocus, buttonControl, buttonAvailable, buttonUnavailable } from "./control";

const raised =
  "0 0 0 5px color-mix(in srgb, var(--animic-button-color) 18%, transparent), 0 14px 30px -10px color-mix(in srgb, var(--animic-button-color) 60%, transparent)";
export const button = defineRecipe({
  className: "button",
  base: {
    ...buttonControl,
    _focusVisible: buttonFocus,
    display: "inline-flex",
    flexShrink: 0,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: "3",
    textAlign: "center",
    whiteSpace: "normal",
    textDecorationLine: "none",
    overflowWrap: "anywhere",
    "--animic-button-color": "token(colors.action.primary.bg)",
    [buttonAvailable]: {
      _hover: { transform: "translateY(-2px)" },
      _active: { transform: "translateY(1px)" },
      _motionReduce: {
        _hover: { transform: "none" },
        _active: { transform: "none" },
      },
    },
  },
  variants: {
    appearance: {
      primary: {
        [buttonUnavailable]: {
          background: "action.primary.disabled",
          color: "action.primary.fg",
          borderColor: "transparent",
        },
        [buttonAvailable]: {
          background: "action.primary.bg",
          color: "action.primary.fg",
          borderColor: "transparent",
        },
      },
      secondary: {
        "--animic-button-color": "token(colors.fg.default)",
        [buttonAvailable]: {
          background: "bg.surface",
          color: "fg.default",
          borderColor: "border.strong",
        },
      },
      inverse: {
        "--animic-button-color": "token(colors.bg.inverse)",
        [buttonAvailable]: {
          background: "bg.inverse",
          color: "fg.inverse",
          borderColor: "border.strong",
        },
      },
      soft: {
        "--animic-button-color": "token(colors.fg.supporting)",
        [buttonAvailable]: {
          background: "bg.subtle",
          color: "fg.supporting",
          borderColor: "transparent",
        },
      },
      overlay: {
        borderWidth: "0",
        color: "fg.inverse",
        transitionProperty: "background, scale",
        transitionDuration: "2",
        [buttonAvailable]: {
          background: "color-mix(in srgb, token(colors.bg.inverse) 55%, transparent)",
          _hover: {
            background: "color-mix(in srgb, token(colors.bg.inverse) 80%, transparent)",
            transform: "none",
            scale: "1.04",
            "& [data-animic-button-icon=end] > svg": { translate: "2px 0" },
          },
          _focusVisible: {
            outlineStyle: "none",
            outlineWidth: "0",
            textDecorationLine: "none",
            background: "color-mix(in srgb, token(colors.bg.inverse) 80%, transparent)",
            scale: "1.04",
            "& [data-animic-button-icon=end] > svg": { translate: "2px 0" },
          },
          _active: { transform: "none", scale: "0.96" },
          "& [data-animic-button-icon=end] > svg": {
            transition: "translate 160ms ease",
          },
          "@media (forced-colors: active)": {
            _focusVisible: {
              outline: "2px solid Highlight",
              outlineOffset: "2px",
            },
          },
          _motionReduce: {
            _hover: {
              scale: "1",
              "& [data-animic-button-icon=end] > svg": { translate: "none" },
            },
            _focusVisible: {
              scale: "1",
              "& [data-animic-button-icon=end] > svg": { translate: "none" },
            },
            _active: { scale: "1" },
            "& [data-animic-button-icon=end] > svg": { transition: "none" },
          },
        },
      },
      outlined: {
        [buttonAvailable]: {
          background: "bg.surface",
          color: "fg.default",
          borderColor: "border.default",
          _hover: { borderColor: "border.strong", transform: "none" },
          _active: { transform: "none" },
          "&[aria-pressed=true]": {
            background: "bg.inverse",
            borderColor: "border.strong",
            color: "fg.inverse",
          },
        },
      },
      quiet: {
        minHeight: "control.0",
        textStyle: "label.supporting",
        borderWidth: "0",
        textDecorationLine: "underline",
        textUnderlineOffset: "3px",
        [buttonAvailable]: {
          background: "transparent",
          color: "fg.muted",
          _hover: { color: "accent.primary", transform: "none" },
          _active: { transform: "none" },
        },
      },
    },
    size: {
      xs: {
        fontSize: "0.78rem",
        minHeight: "control.0",
        padding: "0.45rem 0.9rem",
        gap: "0.35rem",
        _buttonCompact: { padding: "0.35rem 0.7rem", fontSize: "0.7rem" },
      },
      compact: {
        fontSize: "0.95rem",
        lineHeight: "1.45",
        letterSpacing: "0.08em",
        minHeight: "control.0",
        padding: "0.7rem 1.25rem",
        gap: "0.6rem",
      },
      sm: {
        textStyle: "label.supporting",
        minHeight: "control.0",
        paddingInline: "4",
        paddingBlock: "3",
      },
      md: { minHeight: "control.1", paddingInline: "5", paddingBlock: "3" },
      lg: {
        minHeight: "3.75rem",
        textStyle: "label",
        fontSize: "1.05rem",
        paddingInline: "6",
        paddingBlock: "4",
      },
      hero: {
        textStyle: "label.action",
        paddingInline: "calc(token(spacing.6) * 1.2)",
        paddingBlock: "calc(token(spacing.5) * 1.2)",
        gap: "5",
        _actionPortrait: { textStyle: "label.action.portrait" },
        _actionCompact: {
          textStyle: "label",
          minHeight: "3.5rem",
          paddingInline: "4",
          paddingBlock: "3",
          gap: "3",
          "& > [data-animic-button-icon=start] > svg": { width: "icon.1", height: "icon.1" },
          "& > [data-animic-button-icon=end] > svg": { width: "0.5625rem", height: "0.9375rem" },
          _actionNarrow: { "& > [data-animic-button-icon=end]": { display: "none" } },
        },
      },
      nav: {
        minHeight: "2.5rem",
        padding: "0.55rem 1.2rem",
        textStyle: "label.navigation",
        gap: "0.45rem",
        position: "relative",
        "&::before": { content: '""', position: "absolute", inset: "-2px" },
        _navigationCompact: { paddingInline: "1rem" },
      },
    },
    shape: { rounded: {}, pill: { borderRadius: "full" } },
    prominence: {
      standard: {},
      raised: {
        [buttonAvailable]: {
          boxShadow: `var(--animic-button-decoration-shadow, ${raised})`,
        },
      },
      lifted: {
        [buttonAvailable]: {
          boxShadow:
            "var(--animic-button-decoration-shadow, 0 8px 18px -8px color-mix(in srgb, var(--animic-button-color) 70%, transparent))",
        },
      },
    },
    tone: { neutral: {}, green: {}, yellow: {}, cyan: {} },
    pressing: {
      true: {
        animation: "press 350ms ease",
        _motionReduce: { animation: "none" },
      },
      false: {},
    },
    responsiveLabel: {
      true: {
        "& > [data-animic-button-label=full]": {
          display: "var(--animic-button-full-label-display, inline)",
          _actionCompact: { display: "var(--animic-button-full-label-display, none)" },
        },
        "& > [data-animic-button-label=compact]": {
          display: "var(--animic-button-compact-label-display, none)",
          _actionCompact: { display: "var(--animic-button-compact-label-display, inline)" },
        },
      },
      false: {},
    },
    icons: {
      true: {
        "& > [data-animic-button-icon]": {
          display: "inline-flex",
          flexShrink: 0,
          alignItems: "center",
        },
        "& > [data-animic-button-label]": { flex: "0 1 auto", minWidth: 0 },
      },
      false: {},
    },
  },
  compoundVariants: [
    { appearance: "secondary", shape: "pill", css: { borderWidth: "2" } },
    { appearance: "outlined", shape: "pill", css: { borderWidth: "2" } },
    {
      appearance: "soft",
      tone: "green",
      css: {
        "--animic-button-color": "token(colors.green.1)",
        [buttonAvailable]: { background: "green.0", color: "green.1" },
      },
    },
    {
      appearance: "soft",
      tone: "yellow",
      css: {
        "--animic-button-color": "token(colors.fg.accent.highlight)",
        [buttonAvailable]: {
          background: "bg.accent.highlight",
          color: "fg.accent.highlight",
        },
      },
    },
    {
      appearance: "soft",
      tone: "cyan",
      css: {
        "--animic-button-color": "token(colors.fg.accent.secondary)",
        [buttonAvailable]: {
          background: "bg.accent.secondary",
          color: "fg.accent.secondary",
        },
      },
    },
    {
      size: "hero",
      prominence: "raised",
      css: {
        _actionCompact: {
          [buttonAvailable]: {
            boxShadow:
              "var(--animic-button-decoration-shadow, 0 0 0 4px color-mix(in srgb, var(--animic-button-color) 16%, transparent), 0 10px 22px -10px color-mix(in srgb, var(--animic-button-color) 70%, transparent))",
          },
        },
      },
    },
  ],
  defaultVariants: { appearance: "primary", size: "md" },
});
