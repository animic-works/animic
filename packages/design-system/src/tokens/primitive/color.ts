import { defineTokens } from "@pandacss/dev";

export const colors = defineTokens.colors({
  neutral: {
    0: { value: "#ffffff" },
    1: { value: "#f5f6f8" },
    2: { value: "#e6e8ec" },
    3: { value: "#dfe2e7" },
    4: { value: "#9aa3ae" },
    5: { value: "#5b6573" },
    6: { value: "#0b1b2b" },
  },
  pink: {
    0: { value: "#fff7fb" },
    1: { value: "#ff72b9" },
    2: { value: "#ff2d87" },
    3: { value: "#c71565" },
  },
  cyan: {
    0: { value: "#00b4fc" },
    1: { value: "#0077a6" },
  },
  yellow: { 0: { value: "#fddb13" } },
  green: {
    0: { value: "#dcfce7" },
    1: { value: "#15803d" },
  },
  red: { 0: { value: "#b42318" } },
});
