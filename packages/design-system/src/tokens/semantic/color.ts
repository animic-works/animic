import { defineSemanticTokens } from "@pandacss/dev";

export const colors = defineSemanticTokens.colors({
  brand: { discord: { value: "{colors.indigo.0}" } },
  avatar: {
    pink: { bg: { value: "{colors.pink.2}" }, fg: { value: "{colors.neutral.0}" } },
    cyan: { bg: { value: "{colors.cyan.0}" }, fg: { value: "{colors.neutral.0}" } },
    yellow: { bg: { value: "{colors.yellow.0}" }, fg: { value: "{colors.neutral.6}" } },
    rose: { bg: { value: "{colors.pink.1}" }, fg: { value: "{colors.neutral.0}" } },
    sky: {
      bg: { value: "color-mix(in srgb, {colors.cyan.0} 56%, {colors.neutral.0})" },
      fg: { value: "{colors.neutral.6}" },
    },
    cream: {
      bg: { value: "color-mix(in srgb, {colors.yellow.0} 50%, {colors.neutral.0})" },
      fg: { value: "{colors.neutral.6}" },
    },
    gray: { bg: { value: "{colors.neutral.5}" }, fg: { value: "{colors.neutral.0}" } },
    green: { bg: { value: "{colors.teal.0}" }, fg: { value: "{colors.neutral.0}" } },
    violet: { bg: { value: "{colors.violet.0}" }, fg: { value: "{colors.neutral.0}" } },
    orange: { bg: { value: "{colors.orange.0}" }, fg: { value: "{colors.neutral.0}" } },
    ink: { bg: { value: "{colors.neutral.6}" }, fg: { value: "{colors.neutral.0}" } },
  },
  bg: {
    canvas: { value: "{colors.neutral.1}" },
    surface: { value: "{colors.neutral.0}" },
    subtle: { value: "{colors.neutral.1}" },
    inverse: { value: "{colors.neutral.6}" },
    accent: {
      primary: { value: "color-mix(in srgb, {colors.pink.2} 12%, {colors.neutral.0})" },
      secondary: { value: "color-mix(in srgb, {colors.cyan.0} 12%, {colors.neutral.0})" },
      highlight: { value: "color-mix(in srgb, {colors.yellow.0} 12%, {colors.neutral.0})" },
    },
  },
  fg: {
    default: { value: "{colors.neutral.6}" },
    muted: { value: "{colors.neutral.5}" },
    supporting: { value: "{colors.neutral.5.5}" },
    subtle: { value: "{colors.neutral.4}" },
    inverse: { value: "{colors.neutral.0}" },
    accent: { secondary: { value: "{colors.cyan.1}" }, highlight: { value: "{colors.yellow.1}" } },
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
      bg: { value: "{colors.pink.2}" },
      fg: { value: "{colors.neutral.0}" },
      hover: { value: "{colors.pink.2}" },
      pressed: { value: "{colors.pink.2}" },
      disabled: { value: "color-mix(in srgb, {colors.pink.2} 35%, {colors.neutral.0})" },
    },
  },
  selection: {
    bg: { value: "{colors.pink.0}" },
    border: { value: "{colors.pink.2}" },
    fg: { value: "{colors.neutral.6}" },
  },
  status: {
    success: {
      indicator: { value: "{colors.green.0.5}" },
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
