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
  // 見出し・説明文の後ろに帯を置かない。狭い画面ほど帯を短く・細くし、左右の端へ寄せる。
  _artworkNarrow: { height: "[12rem]" },
  _artworkCompact: { height: "[7rem]" },
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
  _artworkNarrow: {
    "&[data-band='0']": { left: "[1%]", width: "[4rem]" },
    "&[data-band='1']": { left: "[8%]", width: "[1rem]" },
    "&[data-band='2']": { right: "[6%]", width: "[3.5rem]" },
    "&[data-band='3']": { right: "[1%]", width: "[0.9rem]" },
  },
  _artworkCompact: {
    "&[data-band='0']": { left: "[-1.5rem]", width: "[2.5rem]" },
    "&[data-band='1']": { left: "[1.6rem]", width: "[0.5rem]" },
    "&[data-band='2']": { right: "[-1.5rem]", width: "[2.5rem]" },
    "&[data-band='3']": { right: "[1.6rem]", width: "[0.5rem]" },
  },
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

const laurelLeaves = [
  [11, 21, -20],
  [8.6, 16.5, -40],
  [7.8, 11.5, -65],
  [8.8, 6.6, -95],
] as const;
const laurels = css({ position: "absolute", inset: "[0]", width: "[100%]", height: "[100%]" });
/**
 * 表彰台の順位の帯の飾り。数字の左右に月桂冠と短い斜線を置く。
 * `tone`は帯の色に合わせた飾りの色（濃い帯には白、黄色の帯には紺）。
 */
export function PodiumLaurels({ tone }: { tone: "light" | "dark" }) {
  const ink = tone === "light" ? "#ffffff" : "#0b1b2b";
  // 弧に沿って葉を並べた枝。左側を描き、右側は左右反転して使う。
  const branch = (
    <g fill={ink} opacity="0.6">
      <path d="M13 23 Q6.5 15 9.5 4" fill="none" stroke={ink} strokeWidth="0.8" />
      {laurelLeaves.map(([x, y, r]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx="2.4"
          ry="1.05"
          transform={`rotate(${r} ${x} ${y})`}
        />
      ))}
      {laurelLeaves.slice(0, 3).map(([x, y, r]) => (
        <ellipse
          key={`i-${x}-${y}`}
          cx={x + 2.6}
          cy={y - 1.2}
          rx="2.1"
          ry="0.95"
          transform={`rotate(${r + 70} ${x + 2.6} ${y - 1.2})`}
        />
      ))}
    </g>
  );
  return (
    <svg
      className={laurels}
      viewBox="0 0 100 26"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g transform="translate(24 0)">{branch}</g>
      <g transform="translate(76 0) scale(-1 1)">{branch}</g>
      <g stroke={ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.5">
        <path d="M18 17 L21 9" />
        <path d="M82 9 L79 17" />
      </g>
    </svg>
  );
}

const sparkleField = css({
  position: "absolute",
  top: "[0.4rem]",
  left: "[50%]",
  translate: "[-50% 0]",
  width: "[15rem]",
  height: "[3rem]",
  pointerEvents: "none",
  _artworkCompact: { width: "[9rem]", height: "[2.2rem]" },
});
const sparkle = (x: number, y: number, s: number, fill: string) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"
    fill={fill}
  />
);

/** 1位のカードの王冠のまわりのきらめき。 */
export function WinnerSparkles() {
  return (
    <svg className={sparkleField} viewBox="0 0 150 30" aria-hidden="true">
      {sparkle(14, 18, 0.9, "#fddb13")}
      {sparkle(34, 8, 0.6, "#ff2d87")}
      {sparkle(118, 10, 0.7, "#fddb13")}
      {sparkle(138, 20, 0.55, "#00b4fc")}
    </svg>
  );
}

const resultCard = css({
  position: "relative",
  height: "[100%]",
  // 勝者のカードは、表彰台の1位のカードと同じく1位の色の光で縁取る。
  "&[data-winner=true]": {
    filter:
      "[drop-shadow(0 0 0.5rem rgb(255 45 135 / 0.35)) drop-shadow(0 0.9rem 1.4rem rgb(255 45 135 / 0.3))]",
  },
});
const resultCardCrown = css({
  position: "absolute",
  top: "[-1.6rem]",
  left: "[50%]",
  width: "[12rem]",
  height: "[3.6rem]",
  translate: "[-50% 0]",
  pointerEvents: "none",
  _artworkCompact: { top: "[-1.3rem]", width: "[8rem]", height: "[2.8rem]" },
});
const resultCardSparkles = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
});
const resultCardCrownMark = css({
  position: "absolute",
  top: "[0]",
  left: "[50%]",
  translate: "[-50% 0]",
  _artworkCompact: { scale: "[0.8]", transformOrigin: "[top center]" },
});
/**
 * 1対1の結果のカードの外枠。勝者のカードには、3人以上の表彰台の1位と同じ王冠をカードの上端の中央に載せ、
 * まわりにきらめきを置き、1位の色の光で縁取る。カードは比較の欄の高さいっぱいに広げ、左右の大きさをそろえる。
 */
export function ResultCardFrame({
  winner,
  animate,
  children,
}: {
  winner: boolean;
  /** `false`なら王冠を登場の動きなしで出す。 */
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <div className={resultCard} data-winner={winner}>
      {children}
      {winner && (
        <span className={resultCardCrown} aria-hidden="true">
          <svg className={resultCardSparkles} viewBox="0 0 120 36" aria-hidden="true">
            {sparkle(18, 22, 0.9, "#fddb13")}
            {sparkle(32, 8, 0.6, "#ff2d87")}
            {sparkle(90, 8, 0.7, "#fddb13")}
            {sparkle(104, 24, 0.55, "#00b4fc")}
          </svg>
          <span className={resultCardCrownMark}>
            <Crown animate={animate} />
          </span>
        </span>
      )}
    </div>
  );
}

const shardFloat = keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-6px)" },
});
const shardField = css({
  position: "absolute",
  inset: "[0]",
  overflow: "hidden",
  pointerEvents: "none",
});
// 画面の左右の余白と上部にだけ置く破片・帯・きらめき・点。中央の作品と文字の背後には置かない。
const shard = css({
  position: "absolute",
  animationName: `[${shardFloat}]`,
  animationDuration: "[5s]",
  animationTimingFunction: "[ease-in-out]",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]" },
  "&[data-shard='0']": { left: "[2%]", top: "[8rem]", width: "[5rem]", height: "[7rem]" },
  "&[data-shard='1']": {
    left: "[7%]",
    top: "[20rem]",
    width: "[2rem]",
    height: "[2rem]",
    animationDelay: "[-1s]",
  },
  "&[data-shard='2']": {
    left: "[3%]",
    top: "[33rem]",
    width: "[3.5rem]",
    height: "[3.5rem]",
    animationDelay: "[-2s]",
  },
  "&[data-shard='3']": {
    left: "[9%]",
    top: "[44rem]",
    width: "[1.6rem]",
    height: "[1.6rem]",
    animationDelay: "[-3s]",
  },
  "&[data-shard='4']": {
    right: "[2%]",
    top: "[9rem]",
    width: "[4.5rem]",
    height: "[6rem]",
    animationDelay: "[-1.5s]",
  },
  "&[data-shard='5']": {
    right: "[8%]",
    top: "[22rem]",
    width: "[2.2rem]",
    height: "[2.2rem]",
    animationDelay: "[-2.5s]",
  },
  "&[data-shard='6']": {
    right: "[3%]",
    top: "[33rem]",
    width: "[3rem]",
    height: "[3rem]",
    animationDelay: "[-0.5s]",
  },
  "&[data-shard='7']": {
    right: "[10%]",
    top: "[47rem]",
    width: "[4rem]",
    height: "[2rem]",
    animationDelay: "[-3.5s]",
  },
  // 狭い画面では、文字や画像に重ならないよう上の隅の飾りだけを残す。
  _artworkCompact: {
    "&[data-shard='1'], &[data-shard='2'], &[data-shard='3'], &[data-shard='5'], &[data-shard='6'], &[data-shard='7']":
      { opacity: 0 },
    "&[data-shard='0']": { left: "[-1rem]", top: "[4.5rem]", width: "[3rem]", height: "[4rem]" },
    "&[data-shard='4']": { right: "[-1rem]", top: "[4.5rem]", width: "[3rem]", height: "[4rem]" },
  },
});
const shardShapes = [
  // 斜めの帯（水色・黄）
  <g key="0">
    <path d="M30 0h40L40 100H0z" fill="#00b4fc" />
    <path d="M78 0h12L60 100H48z" fill="#fddb13" />
  </g>,
  // 三角の破片（ピンク）
  <path key="1" d="M10 90L50 10L90 70z" fill="#ff2d87" />,
  // 点の模様
  <g key="2" fill="#00b4fc" opacity="0.55">
    {[15, 40, 65, 90].flatMap((x) =>
      [15, 40, 65, 90].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />),
    )}
  </g>,
  // きらめき（黄）
  <path key="3" d="M50 0L60 40L100 50L60 60L50 100L40 60L0 50L40 40z" fill="#fddb13" />,
  // 斜めの帯（ピンク・黄）
  <g key="4">
    <path d="M60 0h40L60 100H20z" fill="#ff2d87" />
    <path d="M10 0h12L-8 100h-12z" fill="#fddb13" />
  </g>,
  // 三角の破片（水色）
  <path key="5" d="M90 85L45 15L10 75z" fill="#00b4fc" />,
  // きらめき（ピンク）
  <path key="6" d="M50 0L60 40L100 50L60 60L50 100L40 60L0 50L40 40z" fill="#ff2d87" />,
  // 点の模様（黄）
  <g key="7" fill="#fddb13" opacity="0.7">
    {[12, 37, 62, 87].map((x) => (
      <circle key={x} cx={x} cy="50" r="7" />
    ))}
  </g>,
];
/**
 * 最終の結果の背景の飾り。トップページ・対戦開始と同じ水色・ピンク・黄の帯・三角・きらめき・点を、
 * 画面の左右と上部に散らす。ゆっくり揺れ、動きを減らす設定では止める。
 */
export function ResultShards() {
  return (
    <div className={shardField} aria-hidden="true">
      {shardShapes.map((shape, index) => (
        <svg
          key={index}
          className={shard}
          data-shard={index}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {shape}
        </svg>
      ))}
    </div>
  );
}
