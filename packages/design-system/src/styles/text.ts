import { defineTextStyles } from "@pandacss/dev";
export const textStyles = defineTextStyles({
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
