import { useId } from "react";
import { Overlay } from "@animic/react/overlay";
import { css, keyframes } from "@animic/styled-system/css";

const pulse = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });
const edge = css({
  position: "fixed",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
  animationName: `[${pulse}]`,
  animationDuration: "[1s]",
  animationTimingFunction: "[ease-out]",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]", opacity: 0.2 },
});
export function HurryEdge() {
  const glow = useId();
  return (
    <Overlay>
      <svg className={edge} aria-hidden="true">
        <defs>
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="none"
          stroke="#ff2d87"
          strokeWidth="80"
          opacity=".35"
          filter={`url(#${glow})`}
        />
        <rect
          width="100%"
          height="100%"
          fill="none"
          stroke="#ff2d87"
          strokeWidth="8"
          opacity=".7"
        />
      </svg>
    </Overlay>
  );
}
