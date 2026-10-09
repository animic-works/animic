import { css, keyframes } from "@animic/styled-system/css";
import { useReducedMotion } from "../../shared/use-reduced-motion";

const successPop = keyframes({ from: { transform: "scale(0.4)", opacity: 0 } });
const success = css({
  animationName: `[${successPop}]`,
  animationDuration: "[600ms]",
  animationTimingFunction: "[cubic-bezier(0.2, 0.9, 0.3, 1.4)]",
  animationDelay: "[150ms]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function LoginSuccessArtwork() {
  const reduced = useReducedMotion();
  return (
    <svg className={success} width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="44" fill="#ff2d87" opacity="0.14" />
      <circle cx="44" cy="44" r="36" fill="#ff2d87" />
      <g
        transform="translate(24 24) scale(1.6667)"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24">
          {!reduced && (
            <animate
              attributeName="stroke-dashoffset"
              values="24;24;0"
              keyTimes="0;0.5556;1"
              dur="0.9s"
              fill="freeze"
            />
          )}
        </path>
      </g>
    </svg>
  );
}
