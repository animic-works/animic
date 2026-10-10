import { css, keyframes } from "@animic/styled-system/css";

const sweep = keyframes({
  from: { transform: "translateX(-60%) skewX(-18deg)" },
  to: { transform: "translateX(330%) skewX(-18deg)" },
});
const bands = css({
  position: "absolute",
  inset: "[0]",
  overflow: "hidden",
  pointerEvents: "none",
  _motionReduce: { opacity: 0 },
});
const band = css({
  position: "absolute",
  top: "[-20%]",
  left: "[-40%]",
  width: "[60%]",
  height: "[140%]",
  animationName: `[${sweep}]`,
  animationDuration: "[700ms]",
  animationFillMode: "both",
  animationTimingFunction: "[cubic-bezier(.65,0,.35,1)]",
  "&[data-color=yellow]": { animationDelay: "[70ms]" },
  "&[data-color=pink]": { animationDelay: "[140ms]" },
  _motionReduce: { animationName: "[none]" },
});
export function ImageArrival() {
  return (
    <div className={bands} aria-hidden="true">
      {(
        [
          ["cyan", "#00b4fc"],
          ["yellow", "#fddb13"],
          ["pink", "#ff2d87"],
        ] as const
      ).map(([name, color]) => (
        <svg key={name} className={band} data-color={name}>
          <rect width="100%" height="100%" fill={color} />
        </svg>
      ))}
    </div>
  );
}
