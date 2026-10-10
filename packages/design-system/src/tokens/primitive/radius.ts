import { defineTokens } from "@pandacss/dev";

export const radii = defineTokens.radii({
  0: { value: "0" },
  1: { value: "0.5rem" },
  2: { value: "1rem" },
  3: { value: "1.5rem" },
  4: { value: "2rem" },
  full: { value: "9999px", description: "完全に丸める形状。数値scaleの段階には含めない。" },
});
