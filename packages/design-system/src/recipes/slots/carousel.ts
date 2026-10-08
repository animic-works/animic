import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";

export const carousel = defineSlotRecipe({
  className: "carousel",
  slots: ["root", "viewport", "item", "controls", "indicators", "indicator"],
  base: {
    root: { position: "relative", minWidth: 0, _focusVisible: focus },
    viewport: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      overflowX: "clip",
      overflowY: "visible",
      minWidth: 0,
      isolation: "isolate",
      paddingBlock: "0",
      width: "100%",
    },
    item: {
      gridArea: "1 / 1",
      minWidth: 0,
      alignSelf: "stretch",
      paddingInline: "0",
      "& > *, & > * > *": { height: "100%" },
      "&[data-distant]": { visibility: "hidden" },
      transform:
        "translateX(calc(var(--animic-carousel-offset) * (100% + clamp(1.5rem, 4vw, 3.5rem)))) scale(var(--animic-carousel-scale, 1))",
      _rtl: {
        transform:
          "translateX(calc(var(--animic-carousel-offset) * (-100% - token(spacing.9)))) scale(var(--animic-carousel-scale, 1))",
      },
      transitionProperty: "transform, opacity",
      transitionDuration: "0",
      transitionTimingFunction: "expressive, ease",
      "&[data-moving]": {
        transitionDuration: "700ms, 500ms",
        _motionReduce: { transitionDuration: "0" },
      },
      "&[aria-hidden=true]": {
        opacity: 0.5,
        "--animic-carousel-scale": 0.84,
        cursor: "pointer",
      },
      _motionReduce: { transitionDuration: "0" },
    },
    controls: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "3",
      minWidth: 0,
      "& > button > svg": {
        width: "0.875rem",
        height: "1.375rem",
        _rtl: { transform: "rotate(180deg)" },
      },
    },
    indicators: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      minWidth: 0,
    },
    indicator: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1.5rem",
      transition: "width 400ms cubic-bezier(0.65, 0, 0.35, 1)",
      _motionReduce: { transition: "none" },
      minHeight: "control.0",
      padding: "0",
      borderWidth: "0",
      borderRadius: "full",
      background: "transparent",
      cursor: "pointer",
      flexShrink: 0,
      _focusVisible: focus,
      "&::after": {
        content: '""',
        width: "0.75rem",
        height: "0.75rem",
        transition:
          "width 400ms cubic-bezier(0.65, 0, 0.35, 1), background-color 300ms ease, border-color 300ms ease",
        _motionReduce: { transition: "none" },
        borderRadius: "full",
        background: "bg.surface",
        border: "2px solid token(colors.border.default)",
      },
      "&[aria-current=true]": {
        width: "2rem",
        "&::after": { width: "2rem", background: "accent.primary", borderColor: "accent.primary" },
      },
    },
  },
  variants: {
    transition: {
      slide: {},
      replace: {
        viewport: {
          "& > [aria-hidden=true]": { display: "none" },
          "& > *": { transform: "none", transition: "none", visibility: "visible" },
        },
      },
    },
    preview: {
      true: {
        viewport: {
          width: "min(68rem, 72vw)",
          marginInline: "auto",
          overflow: "visible",
          _carouselCompact: { width: "84vw", aspectRatio: "auto" },
          _carouselNarrow: { width: "calc(100vw - 40px)" },
        },
      },
      false: {},
    },
    controls: {
      inline: {},
      sides: {
        controls: {
          "& > button": {
            _carouselWide: {
              position: "absolute",
              top: "calc(50% - token(spacing.6))",
              translate: "0 -50%",
              zIndex: 2,
            },
          },
          "& > button:first-child": {
            _carouselWide: { insetInlineStart: "calc(50% - min(34rem, 36vw) - token(spacing.6))" },
          },
          "& > button:last-child": {
            _carouselWide: { insetInlineEnd: "calc(50% - min(34rem, 36vw) - token(spacing.6))" },
          },
        },
      },
    },
  },
});
