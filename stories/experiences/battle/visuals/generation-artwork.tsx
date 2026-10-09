import { css, keyframes } from "@animic/styled-system/css";

const pipFlash = keyframes({ "50%": { opacity: 0.35 } });
const pendingPip = css({
  "&[data-pending]": {
    animationName: `[${pipFlash}]`,
    _motionReduce: { animationName: "[none]" },
  },
  animationDuration: "[800ms]",
  animationTimingFunction: "[steps(2)]",
  animationIterationCount: "infinite",
});
export function GenerationPips({
  used,
  pending,
  limit,
}: {
  used: number;
  pending: number;
  limit: number;
}) {
  if (!limit) return null;
  const count = limit;
  return (
    <svg width="84" height="8" viewBox={`0 0 ${count * 18} 8`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          className={pendingPip}
          data-pending={(i >= used && i < used + pending) || undefined}
          d={`M${i * 18 + 3} 0h13l-3 8h-13Z`}
          fill={i < used ? "#0b1b2b" : i < used + pending ? "#ff2d87" : "#dfe3e9"}
        />
      ))}
    </svg>
  );
}
