import { defineTokens } from "@pandacss/dev";

export const shadows = defineTokens.shadows({
  soft: {
    1: { value: "0 12px 32px -20px rgb(11 27 43 / 0.24)" },
    2: { value: "0 30px 60px -30px rgb(11 27 43 / 0.35)" },
  },
  solid: {
    1: { value: "4px 4px 0 rgb(11 27 43)" },
    2: { value: "6px 6px 0 rgb(11 27 43)" },
  },
});
