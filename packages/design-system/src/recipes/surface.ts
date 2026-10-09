import { defineRecipe, defineStyles } from "@pandacss/dev";
const card = defineStyles({
  layerStyle: "surface.raised",
  borderWidth: "2",
  borderRadius: "1.75rem",
  _surfaceCompact: { borderRadius: "1.25rem" },
  overflow: "hidden",
});
export const surface = defineRecipe({
  className: "surface",
  base: { boxSizing: "border-box", minWidth: 0, borderRadius: "3", color: "fg.default" },
  variants: {
    appearance: {
      inverse: { background: "bg.inverse", color: "fg.inverse", borderRadius: "1.5rem" },
      tinted: {
        layerStyle: "surface.raised",
        background:
          "radial-gradient(circle at 100% 0, color-mix(in srgb, token(colors.pink.1) 18%, transparent), transparent 45%), token(colors.bg.surface)",
        borderWidth: "2",
        borderRadius: "1.75rem",
      },
      sheet: {
        background: "bg.surface",
        borderRadius: "1.75rem",
        boxShadow: "0 1px 0 rgb(11 27 43 / 0.04), 0 30px 60px -30px rgb(11 27 43 / 0.35)",
        _surfaceNarrow: {
          borderEndStartRadius: "0",
          borderEndEndRadius: "0",
          position: "relative",
          boxShadow: "0 -14px 34px -20px rgb(11 27 43 / 0.4)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "0.7rem",
            left: "50%",
            translate: "-50% 0",
            width: "2.5rem",
            height: "5px",
            borderRadius: "full",
            background: "border.default",
          },
        },
      },
      subtle: { layerStyle: "surface.subtle", borderRadius: "2" },
      plain: { layerStyle: "surface.base" },
      adaptive: {
        background: "transparent",
        _surfaceNarrow: { layerStyle: "surface.base", borderRadius: "2" },
      },
      raised: { layerStyle: "surface.raised" },
      framed: { layerStyle: "surface.framed" },
      card: { ...card, position: "relative" },
      illustrated: { ...card, borderRadius: "2rem" },
      primary: {
        borderRadius: "2",
        background: "bg.accent.primary",
        borderWidth: "0",
      },
      secondary: {
        borderRadius: "2",
        background: "bg.accent.secondary",
        borderWidth: "0",
      },
      highlight: {
        borderRadius: "2",
        background: "bg.accent.highlight",
        borderWidth: "0",
      },
    },
    accent: {
      primary: { "--animic-surface-accent": "token(colors.accent.primary)" },
      secondary: { "--animic-surface-accent": "token(colors.accent.secondary)" },
      highlight: { "--animic-surface-accent": "token(colors.accent.highlight)" },
    },
    padding: {
      content: { padding: "clamp(1.1rem, 2vw, 1.6rem)", _surfaceCompact: { padding: "5" } },
      section: {
        padding: "clamp(1.4rem, 3vw, 2.25rem)",
        _surfaceCompact: { padding: "1rem 1rem 1rem 1.1rem" },
      },
      frame: { padding: "5", _surfaceCompact: { padding: "0.6rem" } },
      "narrow-only": { padding: "0", _surfaceNarrow: { padding: "5" } },
      fluid: {
        padding: "clamp(1.75rem, 5vw, 2.5rem)",
        _surfaceNarrow: { padding: "1.9rem 1rem max(1rem, env(safe-area-inset-bottom, 0px))" },
      },
      xs: { padding: "3" },
      sm: { padding: "4" },
      inset: {
        padding: "clamp(0.6rem, 1.8vw, 1.75rem)",
        _surfaceCompact: { padding: "0.4rem 0.8rem 0.8rem" },
      },
      md: { padding: "5" },
      lg: { padding: "6" },
      xl: { padding: "7" },
    },
  },
  compoundVariants: [
    {
      appearance: "card",
      accent: ["primary", "secondary", "highlight"],
      css: {
        "&::before": {
          content: '""',
          position: "absolute",
          insetInline: "0",
          insetBlockStart: "0",
          height: "0.65rem",
          background: "var(--animic-surface-accent)",
          pointerEvents: "none",
          _surfaceCompact: {
            insetInlineEnd: "auto",
            insetBlockEnd: "0",
            width: "0.375rem",
            height: "auto",
          },
        },
      },
    },
  ],
  defaultVariants: { appearance: "plain", padding: "lg" },
});
