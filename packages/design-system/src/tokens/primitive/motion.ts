import { defineTokens } from "@pandacss/dev";

export const durations = defineTokens.durations({
  0: { value: "0ms" },
  1: { value: "120ms" },
  2: { value: "200ms" },
  3: { value: "360ms" },
});

export const easings = defineTokens.easings({
  linear: { value: "linear" },
  standard: { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
  decelerate: { value: "cubic-bezier(0, 0, 0.2, 1)" },
});
