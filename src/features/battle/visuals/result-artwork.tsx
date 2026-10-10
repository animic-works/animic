import type { ReactNode } from "react";
import { css, keyframes } from "@animic/styled-system/css";

const burstIn = keyframes({
  from: { transform: "skewX(-18deg) translateY(-110%)" },
  to: { transform: "skewX(-18deg)" },
});
const burst = css({
  position: "absolute",
  top: "[0]",
  left: "[50%]",
  translate: "[-50% 0]",
  width: "[min(100%, 75rem)]",
  height: "[17rem]",
  overflow: "hidden",
  opacity: 0.9,
  pointerEvents: "none",
});
const burstBand = css({
  position: "absolute",
  top: "[-20%]",
  height: "[140%]",
  transform: "skewX(-18deg)",
  animationName: `[${burstIn}]`,
  animationDuration: "[900ms]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  "&[data-animate=false]": { animationName: "[none]" },
  _motionReduce: { animationName: "[none]" },
  "&[data-band='0']": { left: "[4%]", width: "[7rem]" },
  "&[data-band='1']": { left: "[13%]", width: "[1.4rem]", animationDelay: "[80ms]" },
  "&[data-band='2']": { right: "[10%]", width: "[6rem]", animationDelay: "[160ms]" },
  "&[data-band='3']": { right: "[4%]", width: "[1.2rem]", animationDelay: "[240ms]" },
});
const confetti = css({
  position: "fixed",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
  _motionReduce: { opacity: 0 },
});
export function ResultBurst({ animate }: { animate: boolean }) {
  return (
    <div className={burst} aria-hidden="true">
      {["#00b4fc", "#fddb13", "#ff2d87", "#fddb13"].map((fill, index) => (
        <svg key={index} className={burstBand} data-band={index} data-animate={animate}>
          <rect width="100%" height="100%" fill={fill} />
        </svg>
      ))}
    </div>
  );
}
export function ResultConfetti({ delayed = false }: { delayed?: boolean }) {
  return (
    <svg className={confetti} viewBox="0 0 1000 900" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 110 }, (_, i) => {
        const x = (i * 173) % 1000,
          duration = 2.4 + ((i * 37) % 20) / 10;
        const delay = ((i * 23) % 80) / 100 + (delayed ? 0.9 : 0);
        const w = 6 + (i % 8);
        return (
          <g key={i} transform={`translate(${x}, -32)`}>
            <animateTransform
              attributeName="transform"
              type="translate"
              from={`${x} -32`}
              to={`${x + (i % 2 ? 1 : -1) * ((i * 13) % 200)} 1000`}
              begin={`${delay}s`}
              dur={`${duration}s`}
              fill="freeze"
              calcMode="spline"
              keySplines=".3 .6 .5 1"
            />
            <rect
              width={w}
              height={w * (1.2 + (i % 10) / 10)}
              rx="2"
              fill={["#ff2d87", "#00b4fc", "#fddb13", "#ff72b9", "#fff"][i % 5]}
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to={String((i % 2 ? 1 : -1) * (180 + ((i * 37) % 540)))}
                begin={`${delay}s`}
                dur={`${duration}s`}
                fill="freeze"
              />
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

const crownDrop = keyframes({
  from: { opacity: 0, transform: "translateY(-2rem) rotate(-20deg) scale(0.6)" },
  to: { opacity: 1, transform: "none" },
});
const crown = css({
  "&[data-animate=false]": { animationName: "[none]" },
  animationName: `[${crownDrop}]`,
  animationDuration: "[1.2s]",
  animationDelay: "[1.4s]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function Crown({ animate }: { animate: boolean }) {
  return (
    <svg
      className={crown}
      data-animate={animate}
      width="56"
      height="42"
      viewBox="0 0 24 18"
      aria-hidden="true"
    >
      <path
        d="M2 5l5 4 5-7 5 7 5-4-2 11H4z"
        fill="#fddb13"
        stroke="#0b1b2b"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
const rankingSequence = css({
  "& > ol > li": {
    animationDelay: "[1600ms]",
    "&:nth-child(2)": { animationDelay: "[1680ms]" },
    "&:nth-child(3)": { animationDelay: "[1760ms]" },
    "&:nth-child(4)": { animationDelay: "[1840ms]" },
    "&:nth-child(5)": { animationDelay: "[1920ms]" },
    "&:nth-child(6)": { animationDelay: "[2000ms]" },
    "&:nth-child(7)": { animationDelay: "[2080ms]" },
    "&:nth-child(8)": { animationDelay: "[2160ms]" },
  },
});
export function ResultRankingReveal({ children }: { children: ReactNode }) {
  return <div className={rankingSequence}>{children}</div>;
}
const slam = keyframes({
  from: { opacity: 0, scale: "[1.8]", filter: "[blur(8px)]" },
  to: { opacity: 1, scale: "[1]", filter: "[blur(0px)]" },
});
const verdict = css({
  animationName: `[${slam}]`,
  animationDuration: "[700ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function VerdictReveal({ children, animate }: { children: ReactNode; animate: boolean }) {
  return animate ? <div className={verdict}>{children}</div> : children;
}
