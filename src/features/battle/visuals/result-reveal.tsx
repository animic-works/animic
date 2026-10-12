import { useId, useSyncExternalStore, type ReactNode } from "react";
import { Heading } from "@animic/react/heading";
import { Overlay } from "@animic/react/overlay";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { css, keyframes } from "@animic/styled-system/css";

// 結果発表の演出。名前の呼び出しは対戦開始の「START!」（battle-entrance.tsx）と同じ帯の形式にし、
// 呼び出しの長さ（`revealTiming.introMs`）に合わせて1.6秒で抜ける。
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
  animationDuration: "[1.6s]",
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
  animationDuration: "[1.6s]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { opacity: 0, animationName: "[none]" },
});

const subscribeNothing = () => () => {};

/** 発表する人の名前を、画面を横切る帯で呼び出す。読み上げには出さない（名前は発表の見出しで伝える）。 */
export function RevealCall({ entry, name }: { entry: string; name: string }) {
  // サーバーで描いた帯はhydrationで作り直され、アニメーションが2回再生されるため、ブラウザで描画してから出す。
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  if (!hydrated) return null;
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
  animationDuration: "[2.2s]",
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
// ボーナスのスタンプは文言によらず同じ大きさ（6rem×3.5rem を0.8倍）にし、点数の右の決まった列に上から重ならずに積む。
const stamp = css({
  position: "absolute",
  right: "[0]",
  width: "[6rem]",
  height: "[3.5rem]",
  scale: "[0.8]",
  transformOrigin: "[right top]",
  animationName: `[${stampIn}]`,
  animationDuration: "[520ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  "&[data-animate=false]": { animationName: "[none]" },
  // 列の中で縦に中央ぞろえにする。2つ目が押されたら、1つ目はなめらかに上へ移る。
  transitionProperty: "[top]",
  transitionDuration: "[300ms]",
  transitionTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  _motionReduce: { animationName: "[none]", transitionDuration: "[0ms]" },
  "&[data-count='1']": { top: "[1.725rem]" },
  "&[data-count='2'][data-slot='0']": { top: "[0.1rem]" },
  "&[data-count='2'][data-slot='1']": { top: "[3.35rem]" },
  // 狭い画面では少し小さくし、採点パネルの高さを抑える。
  _artworkCompact: {
    scale: "[0.75]",
    "&[data-count='1']": { top: "[1.56rem]" },
    "&[data-count='2'][data-slot='0']": { top: "[0.05rem]" },
    "&[data-count='2'][data-slot='1']": { top: "[3.08rem]" },
  },
});
const stampColumn = css({
  position: "relative",
  width: "[5.25rem]",
  height: "[6.25rem]",
  pointerEvents: "none",
  _artworkCompact: { width: "[4.9rem]", height: "[5.75rem]" },
});

/** スタンプの列。最大2つ分の大きさを最初から取り、スタンプの数によって採点パネルの大きさを変えない。 */
export function StampColumn({ children }: { children: ReactNode }) {
  return <div className={stampColumn}>{children}</div>;
}

/** スタンプを押す。`slot`は上からの位置（0〜1）、`count`は列に出ているスタンプの数。 */
export function StampIn({
  children,
  animate,
  slot,
  count,
}: {
  children: ReactNode;
  animate: boolean;
  slot: 0 | 1;
  count: number;
}) {
  return (
    <div className={stamp} data-animate={animate} data-slot={slot} data-count={count}>
      {children}
    </div>
  );
}

const rankSlot = css({ position: "relative", height: "[3.75rem]" });
const rankBand = css({
  position: "absolute",
  inset: "[0]",
  transformOrigin: "[center]",
  animationName: `[${stampIn}]`,
  animationDuration: "[560ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  "&[data-animate=false]": { animationName: "[none]" },
  _motionReduce: { animationName: "[none]" },
});
const rankShape = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  overflow: "visible",
  filter: "[drop-shadow(0 6px 10px rgb(11 27 43 / 0.18))]",
});
const rankContent = css({
  position: "absolute",
  left: "[0]",
  right: "[0]",
  top: "[50%]",
  translate: "[0 -50%]",
});

/**
 * 採点パネルのすぐ下の、途中の順位を出す決まった大きさの場所。点数が出る前は空けておき、
 * 点数を数え終えたら、パネルとほぼ同じ幅の帯を押し込むように出す。ほかの要素の位置を変えない。
 * 帯は見出しの左右の帯と同じ角度の斜めに切った白い札にし、細い縁と影で方眼の背景から浮かせる。
 * 1位はピンク、ほかは紺の縁で示す（文字の色は使う側で選ぶ）。
 */
export function RankBanner({
  children,
  shown,
  animate,
  top,
}: {
  children: ReactNode;
  shown: boolean;
  animate: boolean;
  top: boolean;
}) {
  const edge = top ? "#ff2d87" : "#0b1b2b";
  return (
    <div className={rankSlot}>
      {shown && (
        <div className={rankBand} data-animate={animate}>
          <svg
            className={rankShape}
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M5.5 0.6H99.4L94.5 19.4H0.6z"
              fill="#ffffff"
              stroke={edge}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path d="M5.2 16.4H95.3L94.5 19.4H0.6z" fill={top ? "#fddb13" : "#00b4fc"} />
          </svg>
          <div className={rankContent}>{children}</div>
        </div>
      )}
    </div>
  );
}
