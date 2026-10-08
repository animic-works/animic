import { defineSlotRecipe } from "@pandacss/dev";
export const readout = defineSlotRecipe({
  className: "readout",
  slots: ["root", "label", "value", "digit", "separator", "accessibleValue"],
  base: {
    root: {
      display: "grid",
      justifyItems: "center",
      minWidth: "9.5rem",
      padding: "0.25rem 1rem 0.5rem",
      border: "2px solid var(--animic-readout-border, token(colors.border.default))",
      borderRadius: "1.25rem",
      background: "var(--animic-readout-background, token(colors.bg.surface))",
      boxShadow: "soft.1",
      _readoutNarrow: { minWidth: "8rem", padding: "0.35rem 0.4rem 0.4rem" },
      _readoutCompact: {
        minWidth: "6.3rem",
        padding: "0.2rem 0.6rem 0.4rem",
        borderRadius: "1rem",
      },
    },
    label: {
      textStyle: "eyebrow.strong",
      color: "var(--animic-readout-ink, token(colors.fg.supporting))",
    },
    value: {
      textStyle: "numeric.timer",
      color: "var(--animic-readout-ink, token(colors.fg.default))",
    },
    digit: { flex: "none", width: "0.92em", textAlign: "center" },
    separator: { flex: "none", width: "0.36em", textAlign: "center" },
    accessibleValue: { srOnly: true },
  },
  variants: {
    format: {
      text: {},
      clock: { value: { display: "flex", justifyContent: "center" } },
    },
    emphasis: {
      normal: {},
      urgent: {
        value: {
          animation: "readoutPulse 1s cubic-bezier(0.3, 1.6, 0.5, 1) infinite",
          _motionReduce: { animation: "none" },
        },
      },
    },
    presentation: {
      panel: {},
      stamp: {
        root: {
          minWidth: "0",
          width: "fit-content",
          padding: "0.35rem 0.8rem 0.4rem",
          borderWidth: "3",
          borderColor: "currentColor",
          borderRadius: "0.6rem",
          background: "transparent",
          color: "var(--animic-readout-ink, token(colors.fg.default))",
          boxShadow: "none",
          rotate: "-8deg",
          _readoutNarrow: { minWidth: "0", padding: "0.35rem 0.8rem 0.4rem" },
          _readoutCompact: {
            minWidth: "0",
            padding: "0.35rem 0.8rem 0.4rem",
            borderRadius: "0.6rem",
          },
        },
        label: { color: "inherit" },
        value: { textStyle: "label.stamp", color: "inherit" },
      },
    },
    tone: {
      neutral: {},
      highlight: { root: { "--animic-readout-background": "token(colors.bg.accent.highlight)" } },
      primary: {
        root: {
          "--animic-readout-background": "token(colors.bg.accent.primary)",
          "--animic-readout-border": "token(colors.accent.primary)",
          "--animic-readout-ink": "token(colors.accent.primary)",
        },
      },
    },
  },
});
