import { defineSemanticTokens } from "@pandacss/dev";

export const colors = defineSemanticTokens.colors({
  bg: {
    canvas: { value: "{colors.neutral.1}" },
    surface: { value: "{colors.neutral.0}" },
    subtle: { value: "{colors.neutral.1}" },
    inverse: { value: "{colors.neutral.6}" },
  },
  fg: {
    default: { value: "{colors.neutral.6}" },
    muted: { value: "{colors.neutral.5}" },
    inverse: { value: "{colors.neutral.0}" },
  },
  border: {
    default: { value: "{colors.neutral.3}" },
    strong: { value: "{colors.neutral.6}" },
  },
  accent: {
    primary: { value: "{colors.pink.2}" },
    secondary: { value: "{colors.cyan.0}" },
    highlight: { value: "{colors.yellow.0}" },
  },
  action: {
    link: { fg: { value: "{colors.pink.3}" } },
    primary: {
      bg: { value: "{colors.pink.3}" },
      fg: { value: "{colors.neutral.0}" },
      hover: { value: "{colors.pink.3}" },
      pressed: { value: "{colors.pink.3}" },
    },
  },
  selection: {
    bg: { value: "{colors.pink.0}" },
    border: { value: "{colors.pink.2}" },
    fg: { value: "{colors.neutral.6}" },
  },
  status: {
    success: {
      bg: { value: "{colors.green.0}" },
      fg: { value: "{colors.green.1}" },
      border: { value: "{colors.green.1}" },
    },
    danger: {
      bg: { value: "{colors.neutral.0}" },
      fg: { value: "{colors.red.0}" },
      border: { value: "{colors.red.0}" },
    },
  },
  focus: { ring: { value: "{colors.neutral.6}" } },
  disabled: {
    bg: { value: "{colors.neutral.2}" },
    fg: { value: "{colors.neutral.4}" },
    border: { value: "{colors.neutral.3}" },
  },
});
