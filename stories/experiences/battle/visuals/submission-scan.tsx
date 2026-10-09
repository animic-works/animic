import { css, keyframes } from "@animic/styled-system/css";

const beamMove = keyframes({
  "0%, 100%": { translate: "[0 0]" },
  "50%": { translate: "[calc(100cqw - 3px) 0]" },
});
const beam = css({
  position: "absolute",
  top: "[-0.6rem]",
  bottom: "[-0.6rem]",
  left: "[0]",
  width: "[3px]",
  height: "[calc(100% + 1.2rem)]",
  animationName: `[${beamMove}]`,
  animationDuration: "[2200ms]",
  animationIterationCount: "infinite",
  animationTimingFunction: "[ease-in-out]",
  _motionReduce: { animationName: "[none]" },
});
export function SubmissionScan() {
  return (
    <svg className={beam} aria-hidden="true">
      <rect width="3" height="100%" rx="1.5" fill="#fddb13" />
    </svg>
  );
}
