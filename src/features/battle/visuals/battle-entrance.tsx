import { useId, type ReactNode } from "react";
import { Heading } from "@animic/react/heading";
import { Overlay } from "@animic/react/overlay";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { css, keyframes } from "@animic/styled-system/css";

const sweep = keyframes({
  "0%": { clipPath: "inset(0 100% 0 0)" },
  "22%, 76%": { clipPath: "inset(0)" },
  "100%": { clipPath: "inset(0 0 0 100%)" },
});
const entrance = keyframes({
  "0%, 14%": { opacity: 0, transform: "translateX(-30vw) skewX(24deg)" },
  "28%": { opacity: 1, transform: "translateX(1.5vw) skewX(-8deg)" },
  "34%, 66%": { opacity: 1, transform: "none" },
  "78%, 100%": { opacity: 0, transform: "translateX(30vw) skewX(24deg)" },
});
const band = css({
  position: "fixed",
  left: "[-10%]",
  top: "[50%]",
  width: "[120%]",
  height: "[9rem]",
  translate: "[0 -50%]",
  rotate: "[-6deg]",
  pointerEvents: "none",
  animationName: `[${sweep}]`,
  animationDuration: "[1.5s]",
  animationTimingFunction: "[cubic-bezier(.7,0,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { opacity: 0, animationName: "[none]" },
});
const title = css({
  position: "fixed",
  top: "[50%]",
  left: "[0]",
  width: "[100%]",
  translate: "[0 -50%]",
  rotate: "[-6deg]",
  pointerEvents: "none",
  animationName: `[${entrance}]`,
  animationDuration: "[1.5s]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { opacity: 0, animationName: "[none]" },
});
export function BattleKickoff() {
  return (
    <Overlay>
      <svg className={band} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h100v100H0z" fill="#00b4fc" />
        <path d="M0 7h100v86H0z" fill="#0b1b2b" />
        <path d="M0 93h100v7H0z" fill="#ff2d87" />
      </svg>
      <div className={title} aria-hidden="true">
        <Stack align="center" space="tight">
          <Heading level={2} size="display">
            <Text variant="display.signal" tone="highlight" emphasis="accent-shadow">
              START!
            </Text>
          </Heading>
          <Text variant="label.supporting" tone="inverse">
            お題にいちばん近い1枚を作ろう
          </Text>
        </Stack>
      </div>
    </Overlay>
  );
}

const flip = keyframes({
  from: { transform: "perspective(900px) rotateY(-90deg) scale(0.9)", opacity: 0 },
  "60%": { transform: "perspective(900px) rotateY(8deg)", opacity: 1 },
  to: { transform: "none", opacity: 1 },
});
const reveal = css({
  width: "[100%]",
  "&[data-state=waiting], &[data-state=kickoff]": { opacity: 0 },
  "&[data-state=revealing]": {
    animationName: `[${flip}]`,
    animationDuration: "[900ms]",
    animationFillMode: "both",
    animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
    _motionReduce: { animationName: "[none]" },
  },
});
const topic = css({ position: "relative", width: "[100%]" });
const cardBack = css({ position: "absolute", inset: "[0]", pointerEvents: "none" });
const backArtwork = css({ width: "[100%]", height: "[100%]" });
const backCaption = css({ position: "absolute", top: "[64%]", width: "[100%]" });
export function TopicReveal({
  children,
  phase,
}: {
  children: ReactNode;
  phase: "waiting" | "kickoff" | "revealing" | "complete";
}) {
  const stripes = useId();
  return (
    <div className={topic}>
      <div className={reveal} data-state={phase} inert={phase === "waiting" || phase === "kickoff"}>
        {children}
      </div>
      {(phase === "waiting" || phase === "kickoff") && (
        <div className={cardBack} aria-hidden="true" inert>
          <svg className={backArtwork}>
            <defs>
              <pattern
                id={stripes}
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(30)"
              >
                <rect width="12" height="24" fill="#ffffff" opacity="0.07" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" rx="16" fill="#0b1b2b" />
            <rect width="100%" height="100%" rx="16" fill={`url(#${stripes})`} />
            <image href="/favicon.svg" x="33%" y="28%" width="34%" height="34%" />
          </svg>
          <div className={backCaption}>
            <Text as="p" variant="eyebrow" tone="highlight" align="center">
              Topic image
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
