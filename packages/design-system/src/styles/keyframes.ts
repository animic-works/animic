import { defineKeyframes } from "@pandacss/dev";
export const keyframes = defineKeyframes({
  mediaEnter: { from: { transform: "scale(1.12)" }, to: { transform: "none" } },
  thumbnailEnter: {
    from: { opacity: 0, transform: "scale(0.5) rotate(-12deg)" },
    to: { opacity: 1, transform: "none" },
  },
  itemRise: {
    from: { opacity: 0, transform: "translateY(4rem)" },
    to: { opacity: 1, transform: "none" },
  },
  activityPulse: {
    "50%": {
      boxShadow: "0 0 0 4px color-mix(in srgb, token(colors.accent.secondary) 25%, transparent)",
    },
  },
  progressStripes: { to: { backgroundPosition: "32px 0, 0 0" } },
  progressPulse: { "50%": { opacity: 0.55 } },
  readoutPulse: {
    "0%, 60%, 100%": { transform: "scale(1)" },
    "15%": { transform: "scale(1.14)" },
  },
  codeSettle: {
    from: { scale: "1.3", background: "token(colors.accent.highlight)" },
    to: { scale: "1" },
  },
  press: { "40%": { transform: "scale(0.94)" } },
  caretBlink: { "50%": { opacity: 0 } },
  scrollHint: { from: { backgroundPosition: "0 100%" }, to: { backgroundPosition: "0 -100%" } },
  scrollHintEnter: { from: { opacity: 0 }, to: { opacity: 1 } },
  sheetEnter: { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
  loading: { to: { transform: "rotate(360deg)" } },
  popoverEnter: {
    from: { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
});
