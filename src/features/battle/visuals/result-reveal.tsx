import { useId, type ReactNode } from "react";
import { Heading } from "@animic/react/heading";
import { Overlay } from "@animic/react/overlay";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { css, keyframes } from "@animic/styled-system/css";

// 結果発表の演出。名前の呼び出しは対戦開始の「START!」（battle-entrance.tsx）と同じ帯の形式にし、
// 呼び出しの長さ（`revealTiming.introMs`）に合わせて1.2秒で抜ける。
const callSweep = keyframes({
  "0%": { clipPath: "inset(0 100% 0 0)" },
  "24%, 74%": { clipPath: "inset(0)" },
  "100%": { clipPath: "inset(0 0 0 100%)" },
});
const callEntrance = keyframes({
  "0%, 12%": { opacity: 0, transform: "translateX(-24vw) skewX(20deg)" },
  "28%": { opacity: 1, transform: "translateX(1vw) skewX(-6deg)" },
  "34%, 68%": { opacity: 1, transform: "none" },
  "80%, 100%": { opacity: 0, transform: "translateX(24vw) skewX(20deg)" },
});
const callBand = css({
  position: "fixed",
  left: "[-10%]",
  top: "[50%]",
  width: "[120%]",
  height: "[12rem]",
  translate: "[0 -50%]",
  rotate: "[-6deg]",
  pointerEvents: "none",
  animationName: `[${callSweep}]`,
  animationDuration: "[1.2s]",
  animationTimingFunction: "[cubic-bezier(.7,0,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { opacity: 0, animationName: "[none]" },
});
const callTitle = css({
  position: "fixed",
  top: "[50%]",
  left: "[0]",
  width: "[100%]",
  translate: "[0 -50%]",
  rotate: "[-6deg]",
  pointerEvents: "none",
  animationName: `[${callEntrance}]`,
  animationDuration: "[1.2s]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { opacity: 0, animationName: "[none]" },
});

/** 発表する人の名前を、画面を横切る帯で呼び出す。読み上げには出さない（名前は発表の見出しで伝える）。 */
export function RevealCall({ entry, name }: { entry: string; name: string }) {
  return (
    <Overlay>
      <svg className={callBand} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h100v100H0z" fill="#00b4fc" />
        <path d="M0 7h100v86H0z" fill="#0b1b2b" />
        <path d="M0 93h100v7H0z" fill="#ff2d87" />
      </svg>
      <div className={callTitle} aria-hidden="true">
        <Stack align="center" space="tight">
          <Text variant="eyebrow" tone="highlight">
            {entry}
          </Text>
          <Heading level={2} size="display">
            <Text variant="display.signal" tone="inverse" emphasis="accent-shadow">
              {name}
            </Text>
          </Heading>
        </Stack>
      </div>
    </Overlay>
  );
}

const scan = keyframes({
  from: { transform: "translateY(-100%)" },
  to: { transform: "translateY(260%)" },
});
const scanFrame = css({
  position: "absolute",
  inset: "[0]",
  overflow: "hidden",
  pointerEvents: "none",
  _motionReduce: { opacity: 0 },
});
const scanBand = css({
  position: "absolute",
  left: "[0]",
  top: "[0]",
  width: "[100%]",
  height: "[38%]",
  animationName: `[${scan}]`,
  animationDuration: "[1.6s]",
  animationTimingFunction: "[cubic-bezier(.45,0,.55,1)]",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]" },
});

/** 採点の様子で、提出画像の上を上から下へ流れる走査の帯。実際の採点の出力ではない装飾。 */
export function JudgingScan() {
  const gradient = useId();
  return (
    <div className={scanFrame} aria-hidden="true">
      <svg className={scanBand} viewBox="0 0 10 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#00b4fc" stopOpacity="0" />
            <stop offset="0.86" stopColor="#00b4fc" stopOpacity="0.28" />
            <stop offset="0.96" stopColor="#ff2d87" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff2d87" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="10" height="100" fill={`url(#${gradient})`} />
      </svg>
    </div>
  );
}

const stampIn = keyframes({
  "0%": { opacity: 0, transform: "scale(1.8)" },
  "60%": { opacity: 1, transform: "scale(0.94)" },
  "100%": { opacity: 1, transform: "none" },
});
const stamp = css({
  animationName: `[${stampIn}]`,
  animationDuration: "[420ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  "&[data-animate=false]": { animationName: "[none]" },
  _motionReduce: { animationName: "[none]" },
});

/** 途中の順位のスタンプを押す。点数の数え上げが終わったときに表示する。 */
export function StampIn({ children, animate }: { children: ReactNode; animate: boolean }) {
  return (
    <div className={stamp} data-animate={animate}>
      {children}
    </div>
  );
}
