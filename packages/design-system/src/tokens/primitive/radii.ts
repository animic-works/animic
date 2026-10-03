import { defineTokens } from "@pandacss/dev";

// 角丸。丸みの強い見た目がAnimicの基本なので、小さい値は少なくする
export const radii = defineTokens.radii({
  none: { value: "0" },
  xs: { value: "0.4rem" },
  sm: { value: "0.5rem" },
  md: { value: "1rem" },
  lg: { value: "1.25rem" },
  xl: { value: "1.75rem" },
  "2xl": { value: "2rem" },
  full: { value: "9999px" },
});
