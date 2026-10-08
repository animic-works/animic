import { defineSemanticTokens } from "@pandacss/dev";
export const zIndex = defineSemanticTokens.zIndex({
  navigation: { value: 1 },
  scrollbar: { value: 2 },
  overlay: { value: 10 },
  toast: { value: 20 },
});
