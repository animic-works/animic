import { definePattern } from "@pandacss/dev";

export const section = definePattern({
  strict: true,
  properties: {
    snap: { type: "enum", value: ["start", "none"] },
    footer: { type: "boolean" },
    height: { type: "enum", value: ["content", "viewport"] },
    align: { type: "enum", value: ["start", "center", "stretch"] },
    inset: { type: "enum", value: ["none", "navigation", "navigation-wide"] },
  },
  defaultValues: { height: "viewport", align: "center", inset: "none", snap: "start" },
  transform({ height, align, inset, footer, snap }, { map }) {
    return {
      position: "relative",
      isolation: "isolate",
      gridTemplateRows: map(footer, (value) => (value ? "1fr auto" : undefined)),
      "--animic-section-gutter": "clamp(1.25rem, 6vw, 6.5rem)",
      "--animic-section-padding-block": "token(spacing.7)",
      "& > [data-animic-section-navigation]": {
        position: "absolute",
        insetBlockEnd: "5",
        insetInlineStart: "50%",
        translate: "-50% 0",
        _sectionCompact: { display: "none" },
      },
      "& > [data-animic-section-background]": {
        position: "absolute",
        inset: "0",
        zIndex: -1,
        pointerEvents: "none",
      },
      "& > [data-animic-section-footer]": {
        marginInline: "calc(-1 * var(--animic-section-gutter))",
        marginBlockEnd: "calc(-1 * var(--animic-section-padding-block))",
        marginBlockStart: "6",
      },
      minWidth: 0,
      display: "grid",
      alignContent: align,
      minHeight: map(height, (value) => (value === "viewport" ? "100svh" : "auto")),
      paddingInline: "var(--animic-section-gutter)",
      paddingBlock: "var(--animic-section-padding-block)",
      scrollSnapAlign: snap,
      scrollSnapStop: map(snap, (value) => (value === "start" ? "always" : "normal")),
      _sectionWide: {
        "--animic-section-padding-block": "token(spacing.9)",
        paddingBlockStart: map(inset, (value) =>
          value === "none"
            ? "9"
            : value === "navigation-wide"
              ? "max(clamp(5.5rem, 13svh, 9rem), calc(var(--animic-navigation-height, 0px) + token(spacing.5)))"
              : "max(clamp(7rem, 16svh, 9rem), calc(var(--animic-navigation-height, 0px) + token(spacing.5)))",
        ),
      },
      paddingBlockStart: map(inset, (value) =>
        value === "none"
          ? "7"
          : value === "navigation-wide"
            ? "max(clamp(5.5rem, 13svh, 9rem), calc(var(--animic-navigation-height, 0px) + token(spacing.5)))"
            : "max(clamp(7rem, 16svh, 9rem), calc(var(--animic-navigation-height, 0px) + token(spacing.5)))",
      ),
      _sectionDense: {
        paddingBlockStart: map(inset, (value) =>
          value === "none"
            ? "7"
            : "max(5.5rem, calc(var(--animic-navigation-height, 0px) + token(spacing.5)))",
        ),
      },
      _sectionPortrait: {
        paddingBlockEnd: map(inset, (value) => (value === "navigation-wide" ? "6.5rem" : "7")),
      },
      _sectionCompact: {
        "--animic-section-gutter": "token(spacing.5)",
        paddingBlockStart: map(inset, (value) =>
          value === "navigation"
            ? "max(calc(token(spacing.10) + token(spacing.4) + env(safe-area-inset-top, 0px)), calc(var(--animic-navigation-height, 0px) + 1.25rem))"
            : value === "navigation-wide"
              ? "max(token(spacing.5), env(safe-area-inset-top, 0px))"
              : "7",
        ),
      },
      "& > [data-animic-section-content]": {
        width: "100%",
        maxWidth: "none",
        marginInline: "auto",
        minWidth: 0,
        display: map(align, (value) => (value === "stretch" ? "grid" : "block")),
      },
    };
  },
});
