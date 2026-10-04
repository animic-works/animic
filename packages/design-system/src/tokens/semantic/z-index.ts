import { defineSemanticTokens } from "@pandacss/dev";
export const zIndex = defineSemanticTokens.zIndex({
  overlay: { value: 10 },
  toast: { value: 20 },
});
