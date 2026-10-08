import { defineTextStyles } from "@pandacss/dev";
export const textStyles = defineTextStyles({
  "label.name": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "0.95rem",
      fontWeight: "black",
      lineHeight: "1.3",
      letterSpacing: "0",
    },
  },
  "numeric.inline": {
    value: {
      fontFamily: "dela",
      fontSize: "1rem",
      fontWeight: "regular",
      lineHeight: "inherit",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.remainder": {
    value: {
      fontFamily: "dela",
      fontSize: "0.75em",
      fontWeight: "regular",
      lineHeight: "inherit",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.score": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(3rem, 5.5vw, 4.4rem)",
      fontWeight: "regular",
      lineHeight: "0.95",
      letterSpacing: "-0.01em",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "label.stamp": {
    value: {
      fontFamily: "dela",
      fontSize: "0.95rem",
      fontWeight: "regular",
      lineHeight: "1.5",
      letterSpacing: "0.04em",
    },
  },
  "heading.dialog": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "clamp(1.5rem, 4.5vw, 1.8rem)",
      fontWeight: "black",
      lineHeight: "1.45",
      letterSpacing: "0.02em",
    },
  },
  "display.announcement": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(3.5rem, 16vw, 7rem)",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "display.statement": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(2.6rem, 8vw, 5.2rem)",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "display.signal": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(3.2rem, 11vw, 6rem)",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0.02em",
    },
  },
  "display.feedback": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(2rem, 6vw, 3.2rem)",
      fontWeight: "regular",
      lineHeight: "1.15",
      letterSpacing: "0",
    },
  },

  "label.announcement": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "clamp(1.2rem, 4.5vw, 1.7rem)",
      fontWeight: "black",
      lineHeight: "1.5",
      letterSpacing: "0.06em",
    },
  },
  "label.artwork": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(1.7rem, 9cqi, 2.2rem)",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0.04em",
    },
  },
  "label.overline": {
    value: {
      fontFamily: "montserrat",
      fontSize: "0.62rem",
      fontWeight: "medium",
      fontStyle: "italic",
      lineHeight: "2",
      letterSpacing: "0.22em",
    },
  },
  "label.caption": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "clamp(1.05rem, 5.4cqi, 1.3rem)",
      fontWeight: "black",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "code.annotation": {
    value: {
      fontFamily: "jetbrainsMono",
      fontSize: "0.6rem",
      fontWeight: "bold",
      lineHeight: "1.5",
      letterSpacing: "0",
    },
  },
  "code.compact": {
    value: {
      fontFamily: "jetbrainsMono",
      fontSize: "0",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0",
    },
  },
  "code.character": {
    value: {
      fontFamily: "jetbrainsMono",
      fontWeight: "bold",
      lineHeight: "0",
      letterSpacing: "0",
    },
  },
  "label.navigation": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "0.95rem",
      fontWeight: "bold",
      lineHeight: "1.3",
      letterSpacing: "0",
      _navigationCompact: { fontSize: "0.85rem" },
    },
  },
  "label.action.portrait": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "clamp(1.1rem, 1.8vw, 1.45rem)",
      fontWeight: "bold",
      lineHeight: "1.5",
      letterSpacing: "0",
    },
  },
  "heading.panel": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "1.15rem",
      fontWeight: "black",
      lineHeight: "1.2",
      letterSpacing: "0",
      _headingCompact: { fontSize: "0.95rem" },
    },
  },
  "numeric.timer": {
    value: {
      fontFamily: "dela",
      fontSize: "2rem",
      fontWeight: "regular",
      lineHeight: "1.15",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
      _readoutNarrow: { fontSize: "1.8rem" },
      _readoutCompact: { fontSize: "1.4rem" },
    },
  },
  "body.document": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "0.95rem",
      fontWeight: "medium",
      lineHeight: "1.9",
      letterSpacing: "0",
      _articleCompact: { fontSize: "1rem", lineHeight: "1.95" },
    },
  },
  "heading.document": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "clamp(1.7rem, 5vw, 2.4rem)",
      fontWeight: "black",
      lineHeight: "1.35",
      letterSpacing: "0",
      _articleCompact: { fontSize: "1.6rem" },
    },
  },
  "heading.prose": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "1.1rem",
      fontWeight: "bold",
      lineHeight: "1.5",
      letterSpacing: "0",
      _articleCompact: { fontSize: "1.12rem" },
    },
  },
  "numeric.hero": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(6rem, 30vw, 12rem)",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "code.display": {
    value: {
      fontFamily: "jetbrainsMono",
      fontSize: "1.2rem",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0.1em",
    },
  },
  "display.title": {
    value: {
      fontFamily: "dela",
      fontSize: "1.3rem",
      fontWeight: "regular",
      lineHeight: "1.4",
      letterSpacing: "0",
      _headingCompact: { fontSize: "1.1rem" },
    },
  },
  "body.detail": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "clamp(0.88rem, 1.1vw, 1rem)",
      fontWeight: "medium",
      lineHeight: "1.8",
      letterSpacing: "0",
      _headingCompact: { fontSize: "0.875rem", lineHeight: "1.65" },
    },
  },
  "heading.illustrated": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "clamp(1.3rem, min(2.4vw, 4.2svh), 2rem)",
      fontWeight: "black",
      lineHeight: "1.3",
      letterSpacing: "0",
    },
  },
  "display.fluid": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(token(fontSizes.5), min(5vw, 7.5svh), token(fontSizes.8))",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
      _headingCompact: {
        fontSize: "clamp(1.5rem, calc((100vw - 32px) / 10.5), 2.6rem)",
        lineHeight: "1.25",
      },
      _headingPortrait: { fontSize: "clamp(token(fontSizes.5), 6vw, token(fontSizes.7))" },
    },
  },
  "display.section": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(2rem, 4.2vw, 3rem)",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
      _headingCompact: { fontSize: "4.5" },
    },
  },
  "display.hero": {
    value: {
      fontFamily: "dela",
      fontSize: "8",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "heading.card": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)",
      _headingCompact: { fontSize: "1.15rem" },
      fontWeight: "black",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "eyebrow.strong": {
    value: {
      fontFamily: "montserrat",
      fontSize: "0",
      fontWeight: "extraBold",
      fontStyle: "italic",
      lineHeight: "2",
      letterSpacing: "0.18em",
    },
  },
  "label.display": {
    value: {
      fontFamily: "montserrat",
      fontSize: "2.2rem",
      fontWeight: "extraBold",
      fontStyle: "italic",
      lineHeight: "1.15",
      letterSpacing: "0",
    },
  },
  eyebrow: {
    value: {
      fontFamily: "montserrat",
      fontSize: "0",
      fontWeight: "medium",
      fontStyle: "italic",
      lineHeight: "2",
      letterSpacing: "0.18em",
    },
  },
  "numeric.counter": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(2.5rem, 4.4vw, 3.6rem)",
      fontWeight: "regular",
      _headingCompact: { fontSize: "2.2rem" },
      lineHeight: "0",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.display": {
    value: {
      fontFamily: "dela",
      fontSize: "5",
      fontWeight: "regular",
      lineHeight: "0",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.ordinal": {
    value: {
      fontFamily: "dela",
      fontSize: "clamp(2.6rem, min(6vw, 9svh), 4.75rem)",
      fontWeight: "regular",
      _numericCompact: { fontSize: "2.6rem" },
      lineHeight: "0",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.fraction": {
    value: {
      fontFamily: "dela",
      fontSize: "0.3em",
      fontWeight: "regular",
      lineHeight: "0",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.supporting": {
    value: {
      fontFamily: "dela",
      fontSize: "3",
      fontWeight: "regular",
      lineHeight: "0",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.stat": {
    value: {
      fontFamily: "dela",
      fontWeight: "regular",
      fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
      lineHeight: "1.1",
      fontVariantNumeric: "tabular-nums",
    },
  },
  "numeric.rank": {
    value: {
      fontFamily: "montserrat",
      fontWeight: "black",
      fontStyle: "italic",
      fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
      lineHeight: "1.1",
    },
  },
  "label.fluid": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0",
      _headingCompact: { fontSize: "1" },
    },
  },
  "label.supporting": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "1",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0",
    },
  },
  "label.action": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "4",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0.06em",
    },
  },
  display: {
    value: {
      fontFamily: "dela",
      fontSize: "7",
      fontWeight: "regular",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "heading.lg": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "5",
      fontWeight: "black",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "heading.md": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "4",
      fontWeight: "black",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "heading.sm": {
    value: {
      fontFamily: "zenMaru",
      fontSize: "3",
      fontWeight: "black",
      lineHeight: "1",
      letterSpacing: "0",
    },
  },
  "body.lead": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
      fontWeight: "bold",
      lineHeight: "1.85",
      letterSpacing: "0",
    },
  },
  "body.md": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "2",
      fontWeight: "medium",
      lineHeight: "3",
      letterSpacing: "0",
    },
  },
  "body.sm": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "1",
      fontWeight: "medium",
      lineHeight: "3",
      letterSpacing: "0",
    },
  },
  "body.prose": {
    value: {
      fontFamily: "zenKaku",
      fontSize: "2",
      fontWeight: "medium",
      lineHeight: "4",
      letterSpacing: "0",
    },
  },
  label: {
    value: {
      fontFamily: "zenKaku",
      fontSize: "2",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0",
    },
  },
  caption: {
    value: {
      fontFamily: "zenKaku",
      fontSize: "0",
      fontWeight: "medium",
      lineHeight: "2",
      letterSpacing: "0",
    },
  },
  code: {
    value: {
      fontFamily: "jetbrainsMono",
      fontSize: "2",
      fontWeight: "bold",
      lineHeight: "2",
      letterSpacing: "0.12em",
    },
  },
  numeric: {
    value: {
      fontFamily: "jetbrainsMono",
      fontSize: "4",
      fontWeight: "bold",
      lineHeight: "1",
      letterSpacing: "0",
      fontVariantNumeric: "tabular-nums",
    },
  },
});
