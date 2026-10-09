import { defineSemanticTokens } from "@pandacss/dev";
export const shadows = defineSemanticTokens.shadows({
  text: {
    offset: { value: "3px 3px 0 {colors.accent.highlight}, 6px 6px 0 {colors.accent.primary}" },
  },
});
