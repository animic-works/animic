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

const approximation = css({
  position: "absolute",
  top: "[50%]",
  left: "[50%]",
  translate: "[-50% -50%]",
  width: "[2.2rem]",
  height: "[1.7rem]",
  _artworkCompact: { width: "[1.1rem]" },
});
export function ApproximationMark() {
  return (
    <svg
      className={approximation}
      viewBox="0 0 36 28"
      fill="none"
      stroke="#ff2d87"
      strokeWidth="4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 9c9-10 17 10 26 0M5 20c9-10 17 10 26 0" />
    </svg>
  );
}
