import { useId, type ReactNode } from "react";
import { Badge } from "@animic/react/badge";
import { Media } from "@animic/react/media";
import { css, keyframes } from "@animic/styled-system/css";

const drift = keyframes({ "50%": { translate: "[2.5rem 0]" } });
const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const throwCard = keyframes({
  from: { opacity: 0, transform: "translateY(40vh) rotate(-25deg) scale(0.7)" },
  to: { opacity: 1, transform: "rotate(-4deg)" },
});
const stamp = keyframes({ from: { opacity: 0, scale: "[2.2]" }, to: { opacity: 1, scale: "[1]" } });
const slam = keyframes({
  from: { opacity: 0, transform: "scale(1.8)" },
  to: { opacity: 1, transform: "none" },
});
const scene = css({
  position: "fixed",
  inset: "[0]",
  overflow: "hidden",
  pointerEvents: "none",
});
const backdrop = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
  animationName: `[${fade}]`,
  animationDuration: "[300ms]",
  _motionReduce: { animationName: "[none]" },
});
const band = css({
  position: "absolute",
  top: "[-30%]",
  height: "[160%]",
  width: "[7rem]",
  left: "[6%]",
  transform: "skewX(-18deg)",
  animationName: `[${drift}]`,
  animationDuration: "[9s]",
  animationTimingFunction: "[linear]",
  animationIterationCount: "infinite",
  "&[data-color=yellow]": {
    left: "[calc(6% + 7.5rem)]",
    width: "[1.6rem]",
  },
  "&[data-color=pink]": {
    left: "[auto]",
    right: "[8%]",
    width: "[5.5rem]",
  },
  _artworkCompact: {
    left: "[-2rem]",
    width: "[4rem]",
    "&[data-color=yellow]": { left: "[2.6rem]", width: "[0.9rem]" },
    "&[data-color=pink]": { right: "[-1.5rem]", width: "[3rem]" },
  },
  _motionReduce: { animationName: "[none]" },
});
export function SubmissionBackdrop() {
  const glow = useId();
  return (
    <div className={scene} aria-hidden="true">
      <svg className={backdrop}>
        <rect width="100%" height="100%" fill="#0b1b2b" />
      </svg>
      <svg className={band}>
        <rect width="100%" height="100%" fill="#00b4fc" />
      </svg>
      <svg className={band} data-color="yellow">
        <rect width="100%" height="100%" fill="#fddb13" />
      </svg>
      <svg className={band} data-color="pink">
        <rect width="100%" height="100%" fill="#ff2d87" />
      </svg>
      <svg className={backdrop}>
        <defs>
          <radialGradient id={glow}>
            <stop offset="18%" stopColor="#0b1b2b" stopOpacity=".9" />
            <stop offset="75%" stopColor="#0b1b2b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${glow})`} />
      </svg>
    </div>
  );
}
const card = css({
  position: "relative",
  width: "[clamp(10rem, 28vh, 15rem)]",
  transform: "rotate(-4deg)",
  animationName: `[${throwCard}]`,
  animationDuration: "[800ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  _artworkCompact: { width: "[min(11rem, 85vw)]" },
  _motionReduce: { animationName: "[none]" },
});
const seal = css({
  position: "absolute",
  right: "[-0.3rem]",
  bottom: "[0.9rem]",
  animationName: `[${stamp}]`,
  animationDuration: "[450ms]",
  animationDelay: "[650ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function SubmittedArtwork({ src }: { src: string }) {
  return (
    <div className={card}>
      <Media src={src} alt="提出した画像" appearance="accented" />
      <div className={seal}>
        <Badge appearance="stamp">提出済み</Badge>
      </div>
    </div>
  );
}
const headline = css({
  animationName: `[${slam}]`,
  animationDuration: "[600ms]",
  animationDelay: "[150ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function SubmissionHeading({ children }: { children: ReactNode }) {
  return <div className={headline}>{children}</div>;
}
const content = css({ position: "relative", height: "[100%]", width: "[100%]" });
export function SubmissionContent({ children }: { children: ReactNode }) {
  return <div className={content}>{children}</div>;
}
