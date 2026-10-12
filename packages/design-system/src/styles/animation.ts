import { defineAnimationStyles } from "@pandacss/dev";
export const animationStyles = defineAnimationStyles({
  loading: {
    value: {
      animationName: "loading",
      animationDuration: "800ms",
      animationTimingFunction: "linear",
      animationIterationCount: "infinite",
      _motionReduce: { animation: "none" },
    },
  },
});
