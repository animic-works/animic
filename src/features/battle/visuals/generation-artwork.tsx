import { css, keyframes } from "@animic/styled-system/css";

const idleFloat = keyframes({ "50%": { transform: "translateY(-6px)" } });
const idleFigure = css({
  animationName: `[${idleFloat}]`,
  animationDuration: "[3.2s]",
  animationTimingFunction: "[ease-in-out]",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]" },
});
export function EmptyImageArtwork() {
  return (
    <svg
      className={idleFigure}
      width="100"
      height="100"
      viewBox="0 0 120 120"
      fill="none"
      stroke="#b8c0cb"
      strokeWidth="3"
      strokeDasharray="7 6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="60" cy="46" r="24" />
      <path d="M20 112c3-24 20-36 40-36s37 12 40 36" />
    </svg>
  );
}
