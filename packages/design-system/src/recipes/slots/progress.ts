import { defineSlotRecipe } from "@pandacss/dev";
export const progress = defineSlotRecipe({
  className: "progress",
  slots: ["root", "label", "track", "fill", "value"],
  base: {
    root: { display: "flex", flexDirection: "column", gap: "3", minWidth: 0 },
    label: { textStyle: "label", color: "fg.default" },
    track: {
      height: "0.5rem",
      borderRadius: "full",
      overflow: "hidden",
      background: "bg.subtle",
      borderWidth: "1",
      borderStyle: "solid",
      borderColor: "border.default",
    },
    fill: {
      height: "100%",
      background: "accent.primary",
      backgroundImage: "var(--animic-progress-fill, none)",
      width: "100%",
      clipPath: "inset(0 calc(100% - var(--animic-progress-value)) 0 0 round 999px)",
      _indeterminate: { clipPath: "none" },
    },
    value: { textStyle: "numeric", color: "fg.default" },
  },
  variants: {
    emphasis: {
      normal: {},
      urgent: {
        root: { "--animic-progress-stripe": "rgb(255 255 255 / 0.35)" },
        fill: {
          "--animic-progress-fill":
            "linear-gradient(token(colors.accent.primary), token(colors.accent.primary))",
          animation: "progressPulse 1s steps(2) infinite",
          _motionReduce: { animation: "none" },
        },
      },
    },
    striped: {
      true: {
        fill: {
          backgroundImage:
            "repeating-linear-gradient(-60deg, var(--animic-progress-stripe, rgb(255 255 255 / 0.28)) 0 6px, transparent 6px 14px), var(--animic-progress-fill, linear-gradient(token(colors.accent.primary), token(colors.accent.primary)))",
          backgroundSize: "32px 100%, 100% 100%",
          transition: "clip-path 250ms linear",
          animation: "progressStripes 900ms linear infinite",
          _motionReduce: { animation: "none", transition: "none" },
        },
      },
    },
    tone: {
      primary: {},
      gradient: {
        root: {
          "--animic-progress-fill":
            "linear-gradient(90deg, token(colors.accent.secondary), token(colors.accent.primary))",
        },
      },
      highlight: {
        root: {
          "--animic-progress-fill":
            "linear-gradient(token(colors.accent.highlight), token(colors.accent.highlight))",
          "--animic-progress-stripe": "token(colors.fg.default)",
        },
      },
    },
    presentation: {
      labeled: {},
      track: {
        root: { gap: "0" },
        track: { height: "0.375rem", border: "0" },
        label: { srOnly: true },
        value: { display: "none" },
      },
    },
  },
  compoundVariants: [
    {
      striped: true,
      emphasis: "urgent",
      css: {
        fill: {
          animation: "progressStripes 450ms linear infinite, progressPulse 1s steps(2) infinite",
          _motionReduce: { animation: "none" },
        },
      },
    },
  ],
});
