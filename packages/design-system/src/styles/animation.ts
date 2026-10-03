import { defineAnimationStyles } from "@pandacss/dev";

// 動きの組み合わせ（どの動きを・どの速さで・どの緩急で）
export const animationStyles = defineAnimationStyles({
  "fade-in": {
    value: {
      animationName: "fade-in",
      animationDuration: "fast",
      animationTimingFunction: "standard",
    },
  },
  "fade-out": {
    value: {
      animationName: "fade-out",
      animationDuration: "fast",
      animationTimingFunction: "standard",
    },
  },
  "scale-in": {
    value: {
      animationName: "scale-in",
      animationDuration: "normal",
      animationTimingFunction: "standard",
    },
  },
  "slide-up": {
    value: {
      animationName: "slide-up",
      animationDuration: "slow",
      animationTimingFunction: "standard",
      animationFillMode: "both",
    },
  },
  // スマホの窓: 下から出るシート
  "sheet-up": {
    value: {
      animationName: "sheet-up",
      animationDuration: "350ms",
      animationTimingFunction: "standard",
    },
  },
  pop: {
    value: {
      animationName: "pop",
      animationDuration: "slow",
      animationTimingFunction: "bounce",
      animationFillMode: "both",
    },
  },
  spin: {
    value: {
      animationName: "spin",
      animationDuration: "slow",
      animationTimingFunction: "linear",
      animationIterationCount: "infinite",
    },
  },
});
