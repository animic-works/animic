import { defineTokens } from "@pandacss/dev";

export const colors = defineTokens.colors({
  neutral: {
    0: { value: "#ffffff" },
    1: { value: "#f5f6f8" },
    2: { value: "#e6e8ec" },
    3: { value: "#dfe2e7" },
    4: { value: "#9aa3ae" },
    5: { value: "#5b6573" },
    "5.5": { value: "#3b4654" },
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
  yellow: { 0: { value: "#fddb13" }, 1: { value: "#8a6900" } },
  green: {
    0: { value: "#dcfce7" },
    "0.5": { value: "#22c55e" },
    1: { value: "#15803d" },
  },
  teal: { 0: { value: "#16b37e" } },
  indigo: { 0: { value: "#5865f2" } },
  violet: { 0: { value: "#7959fc" } },
  orange: { 0: { value: "#ff7a45" } },
  red: { 0: { value: "#b42318" } },
});
