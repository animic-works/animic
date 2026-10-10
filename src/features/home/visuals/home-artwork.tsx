import { useId } from "react";
import { css, keyframes } from "@animic/styled-system/css";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { heroTitleFontScript } from "./hero-title-font";
import logoSvg from "../../../../public/animic-logo.svg?raw";
import bandsSvg from "../../../../public/images/home-decoration.svg?raw";
import cornerSvg from "../../../../public/images/home-corner-decoration.svg?raw";

// 小さな初期装飾はHTMLに含め、別リクエストの完了を待たない。
// SVG文書として埋め込むことで、ロゴと背景内の同名IDも衝突しない。
const logoImage = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`;
const bandsImage = `data:image/svg+xml,${encodeURIComponent(bandsSvg)}`;
const cornerImage = `data:image/svg+xml,${encodeURIComponent(cornerSvg)}`;

const enter = keyframes({
  from: { opacity: 0, transform: "translate(5rem, 3rem) scale(0.92)" },
  to: { opacity: 1, transform: "none" },
});
const logoDrop = keyframes({
  from: { opacity: 0, transform: "translateY(-1rem) scale(0.9) rotate(-3deg)" },
  to: { opacity: 1, transform: "none" },
});
const float = keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(calc(-0.8rem * 2560px / clamp(32rem, 66vw, 82rem)))" },
});
const twinkle = keyframes({
  "0%, 100%": { opacity: 0.35, transform: "scale(0.7) rotate(0deg)" },
  "50%": { opacity: 1, transform: "scale(1.15) rotate(20deg)" },
});
const floating = css({
  position: "absolute",
  top: "[50%]",
  right: "[calc(-1 * clamp(1.25rem, 6vw, 6.5rem) + clamp(-3rem, -1vw, 2rem))]",
  width: "[clamp(32rem, 66vw, 82rem)]",
  translate: "[0 -50%]",
  overflow: "visible",
  pointerEvents: "none",
  animationName: `[${enter}]`,
  animationDuration: "[900ms]",
  animationTimingFunction: "[cubic-bezier(0.2, 0.9, 0.3, 1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
  _artworkMedium: {
    top: "auto",
    bottom: "[-2rem]",
    right: "[calc(-10vw - clamp(1.25rem, 6vw, 6.5rem))]",
    width: "[min(78vw, 46rem)]",
    translate: "[0 0]",
  },
  _artworkCompact: {
    bottom: "auto",
    position: "relative",
    top: "auto",
    right: "auto",
    width: "[min(calc(130cqw + 2.6rem), calc(142cqh + 3.692rem))]",
    // 画像が領域より広い分を補正し、領域の中心を軸に傾ける。
    translate:
      "[calc(-7vw + (min(calc(130cqw + 2.6rem), calc(142cqh + 3.692rem)) - 100cqw - 2rem) * cos(9deg) / 2) calc(0.9rem - (min(calc(130cqw + 2.6rem), calc(142cqh + 3.692rem)) - 100cqw - 2rem) * sin(9deg) / 2)]",
  },
  _artworkPortrait: {
    bottom: "auto",
    position: "relative",
    top: "auto",
    right: "auto",
    width: "[min(calc(118cqw + 7.08vw), calc(165cqh + 10.725rem))]",
    translate: "[11.5vw 3rem]",
  },
});
const floatingImage = css({
  animationName: `[${float}]`,
  animationDuration: "[6s]",
  animationTimingFunction: "[ease-in-out]",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]" },
  _artworkMedium: { animationName: "[none]" },
});
const logo = css({
  position: "relative",
  left: "[-0.5rem]",
  width: "[min(100%, 47rem, 90svh)]",
  _artworkCompact: {
    bottom: "auto",
    position: "relative",
    left: "[-0.375rem]",
    animationName: `[${logoDrop}]`,
    animationDuration: "[700ms]",
    animationTimingFunction: "[cubic-bezier(0.3, 1.5, 0.5, 1)]",
    animationFillMode: "both",
    _motionReduce: { animationName: "[none]" },
    width: "[min(calc(100% + 0.75rem), 26rem, 65svh)]",
  },
  _artworkPortrait: { width: "[min(100%, 38rem, 70svh)]" },
});
const navigationLogo = css({ width: "[100%]" });
const titleEnter = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const title = css({
  transform: "rotate(-4deg) skewX(-6deg)",
  transformOrigin: "left center",
  "&[data-font-state='pending']": { opacity: 0 },
  "&[data-font-state='ready']": {
    animationName: `[${titleEnter}]`,
    animationDuration: "[400ms]",
    animationTimingFunction: "[ease-out]",
    animationFillMode: "both",
  },
  _motionReduce: { opacity: 1, animationName: "[none]" },
});
const underline = css({
  position: "absolute",
  left: "[-0.1em]",
  bottom: "[-0.08em]",
  width: "[calc(100% + 0.4em)]",
  height: "[0.09em]",
  pointerEvents: "none",
});
const marked = css({ position: "relative" });
const secondLine = css({
  position: "relative",
  left: "[1.1em]",
});
const character = css({
  transformOrigin: "1280px 838.5px",
  transform: "rotate(-17deg)",
  _artworkCompact: { transform: "rotate(-9deg)" },
  _artworkPortrait: { transform: "rotate(-9deg)" },
});
const sparkles = css({
  "& > svg > path": {
    transformOrigin: "70px 70px",
    animationName: `[${twinkle}]`,
    animationDuration: "[2.8s]",
    animationTimingFunction: "[ease-in-out]",
    animationIterationCount: "infinite",
    _motionReduce: { animationName: "[none]" },
  },
  "& > svg:nth-child(2) > path": { animationDelay: "[-1.1s]" },
  "& > svg:nth-child(3) > path": { animationDelay: "[-1.9s]" },
  "& > svg:nth-child(4) > path": { animationDelay: "[-0.6s]" },
});

const sparklePath =
  "M70 0C74 44 96 66 140 70 96 74 74 96 70 140 66 96 44 74 0 70 44 66 66 44 70 0Z";

const backdrop = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
});
const heroBands = css({
  width: "[100%]",
  height: "[calc(100% + clamp(2.5rem, 7vw, 6rem))]",
  _artworkNarrow: { maskImage: "[linear-gradient(to bottom, transparent 55%, #000 85%)]" },
  _artworkCompact: { maskImage: "[none]" },
});
const corner = css({
  position: "absolute",
  top: "[0]",
  left: "[0]",
  width: "[clamp(8rem, 16vw, 15rem)]",
  _artworkNarrow: { opacity: 0 },
});

export function PageBackdrop() {
  const grid = useId();
  return (
    <svg className={backdrop} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={grid} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0.5 56V0.5H56" fill="none" stroke="#e6e8ec" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${grid})`} />
    </svg>
  );
}
const howBackdrop = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
  clipPath:
    "[polygon(0 clamp(2.5rem, 7vw, 6rem), 100% 0, 100% calc(100% - clamp(2.5rem, 7vw, 6rem)), 0 100%)]",
});
export function HowBackdrop() {
  return (
    <svg className={howBackdrop} width="100%" height="100%" aria-hidden="true">
      <rect width="100%" height="100%" fill="#fff" />
    </svg>
  );
}
export function HeroBackdrop() {
  return (
    <div className={backdrop} aria-hidden="true">
      <svg className={heroBands} width="100%" height="100%">
        <svg width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMid slice">
          <image href={bandsImage} width="1600" height="900" />
        </svg>
      </svg>
      <svg className={corner} viewBox="0 0 220 240">
        <image href={cornerImage} width="220" height="240" />
      </svg>
    </div>
  );
}

export function Logo({ size = "hero" }: { size?: "hero" | "navigation" | "footer" }) {
  if (size === "hero")
    return (
      <svg className={logo} viewBox="0 0 2078 607" role="img" aria-label="Animic">
        <image href={logoImage} width="2078" height="607" />
      </svg>
    );
  if (size === "navigation")
    return (
      <svg
        className={navigationLogo}
        viewBox="0 0 2078 607"
        width="88"
        role="img"
        aria-label="Animic"
      >
        <image href={logoImage} width="2078" height="607" />
      </svg>
    );
  return (
    <svg viewBox="0 0 2078 607" width="120" role="img" aria-label="Animic">
      <image href={logoImage} width="2078" height="607" />
    </svg>
  );
}

export function HeroTitle() {
  // フォントの初期状態だけは初回描画前のスクリプトが所有する。
  return (
    <div className={title} data-hero-title data-font-state="visible" suppressHydrationWarning>
      <Heading level={2} size="fluid" outlined>
        その
        <Text variant="inherit" tone="accent">
          一枚
        </Text>
        に、
        <br />
        <span className={secondLine}>
          どこまで
          <span className={marked}>
            <Text variant="inherit" tone="accent-secondary">
              近づける
            </Text>
            <svg
              className={underline}
              aria-hidden="true"
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
            >
              <rect width="100" height="4" rx="2" fill="#ff72b9" />
            </svg>
          </span>
          ？
        </span>
      </Heading>
    </div>
  );
}

export function HeroTitleFontScript() {
  return <script>{heroTitleFontScript}</script>;
}

export function HeroArtwork() {
  const shadow = useId();
  return (
    <svg
      viewBox="0 0 2560 1677"
      preserveAspectRatio="xMidYMid slice"
      className={floating}
      aria-hidden="true"
      data-testid="hero-artwork"
    >
      <defs>
        <filter
          id={shadow}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0.0084"
            dy="0.0308"
            stdDeviation="0"
            floodColor="#ff72b9"
            floodOpacity="0.9"
          />
          <feDropShadow
            dx="0"
            dy="0.042"
            stdDeviation="0.032 0.049"
            floodColor="#ff2d87"
            floodOpacity="0.18"
          />
        </filter>
      </defs>
      <g className={character} data-testid="hero-character">
        <image
          className={floatingImage}
          href="/images/hero-character.webp"
          width="2560"
          height="1677"
          filter={`url(#${shadow})`}
        />
        <g className={sparkles}>
          <svg x="230" y="101" width="128" height="128" viewBox="0 0 140 140">
            <path d={sparklePath} fill="#00b4fc" />
          </svg>
          <svg x="2278" y="168" width="128" height="128" viewBox="0 0 140 140">
            <path d={sparklePath} fill="#fddb13" />
          </svg>
          <svg x="102" y="1314" width="128" height="128" viewBox="0 0 140 140">
            <path d={sparklePath} fill="#ff72b9" />
          </svg>
          <svg x="2074" y="1482" width="128" height="128" viewBox="0 0 140 140">
            <path d={sparklePath} fill="#00b4fc" />
          </svg>
        </g>
      </g>
    </svg>
  );
}

const stepArtwork = css({
  width: "[100%]",
  height: "[clamp(14rem, 50svh, 28rem)]",
  _artworkNarrow: { height: "[clamp(8rem, calc(min(32rem, 62svh) - 12rem), 20rem)]" },
  _artworkCompact: { height: "[auto]" },
});
export function StepArtwork({ kind }: { kind: "room" | "image" | "prompt" | "trophy" }) {
  const clip = useId();
  const stripes = useId();
  if (kind === "room") {
    return (
      <svg className={stepArtwork} viewBox="0 0 1600 1095" width="100%" aria-hidden="true">
        <defs>
          <clipPath id={clip}>
            <rect width="1600" height="1095" rx="44" />
          </clipPath>
        </defs>
        <image
          href="/images/how-step-1.webp"
          width="1600"
          height="1095"
          clipPath={`url(#${clip})`}
        />
      </svg>
    );
  }
  return (
    <svg className={stepArtwork} viewBox="0 0 600 410.625" width="100%" aria-hidden="true">
      <defs>
        <pattern
          id={stripes}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <rect y="22" width="26" height="4" fill="#fff" opacity="0.55" />
        </pattern>
      </defs>
      <rect
        width="600"
        height="410.625"
        rx="24"
        fill={kind === "image" ? "#ffe4f1" : kind === "prompt" ? "#fff8ca" : "#e0f6ff"}
      />
      <rect width="600" height="410.625" rx="24" fill={`url(#${stripes})`} />
      <rect
        x="206"
        y="113"
        width="188"
        height="188"
        rx="28"
        fill="#fff"
        stroke="#dfe2e7"
        strokeWidth="2"
        transform="rotate(-6 300 205)"
      />
      <g
        transform="rotate(-6 300 205) translate(244 149) scale(4.67)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "image" && (
          <>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </>
        )}
        {kind === "prompt" && (
          <>
            <path d="M4 6h10M4 12h7M4 18h5" />
            <path d="m17 10 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
          </>
        )}
        {kind === "trophy" && (
          <>
            <path d="M8 21h8M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
            <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
          </>
        )}
      </g>
    </svg>
  );
}

const sampleArtwork = css({
  width:
    "[calc(max(12rem, min(100svh - clamp(7rem, 16svh, 9rem) - 14rem, (44vw - 12rem) * 1216 / 832)) * 832 / 1216)]",
  _artworkNarrow: {
    width:
      "[calc(max(12rem, min(100svh - 5.5rem - 24rem, (50vw - 2.4rem) * 1216 / 832)) * 832 / 1216)]",
  },
  _artworkCompact: {
    width:
      "[calc(max(12rem, min(100svh - 4.75rem - 22rem, (50vw - 2.2rem) * 1216 / 832)) * 832 / 1216)]",
  },
});
const sampleTint = css({
  transitionProperty: "[fill]",
  transitionDuration: "[300ms]",
  transitionTimingFunction: "[ease]",
  _motionReduce: { transitionDuration: "[0ms]" },
});
const sampleSymbol = css({ translate: "[-17px -17px]" });
export function SampleArtwork({ tint }: { tint: string }) {
  const pattern = useId();
  return (
    <svg className={sampleArtwork} width="832" height="1216" aria-hidden="true">
      <defs>
        <pattern
          id={pattern}
          width="19"
          height="19"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <rect y="16" width="19" height="3" fill="#fff" opacity="0.5" />
        </pattern>
      </defs>
      <rect className={sampleTint} width="100%" height="100%" rx="16" fill={tint} />
      <rect width="100%" height="100%" rx="16" fill={`url(#${pattern})`} />
      <svg
        className={sampleSymbol}
        x="50%"
        y="50%"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0b1b2b"
        opacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </svg>
  );
}

const scoreArtwork = css({ width: "[100%]", height: "[auto]" });
/** 採点方法のカードの絵。遊び方の絵と同じ縞の地と白いタイルを、横長の比率で描く。 */
export function ScoreArtwork({ kind }: { kind: "similarity" | "speed" | "attempts" }) {
  const stripes = useId();
  return (
    <svg className={scoreArtwork} viewBox="0 0 600 220" width="100%" aria-hidden="true">
      <defs>
        <pattern
          id={stripes}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <rect y="22" width="26" height="4" fill="#fff" opacity="0.55" />
        </pattern>
      </defs>
      <rect
        width="600"
        height="220"
        rx="24"
        fill={kind === "similarity" ? "#ffe4f1" : kind === "speed" ? "#e0f6ff" : "#fff8ca"}
      />
      <rect width="600" height="220" rx="24" fill={`url(#${stripes})`} />
      <rect
        x="226"
        y="36"
        width="148"
        height="148"
        rx="24"
        fill="#fff"
        stroke="#dfe2e7"
        strokeWidth="2"
        transform="rotate(-6 300 110)"
      />
      <g
        transform="rotate(-6 300 110) translate(256 66) scale(3.67)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "similarity" && (
          <>
            <path d="M12 3a9 9 0 1 0 9 9" />
            <path d="M12 8a4 4 0 1 0 4 4" />
            <path d="M12 12 21 3" />
          </>
        )}
        {kind === "speed" && (
          <>
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2.5M9 2h6" />
          </>
        )}
        {kind === "attempts" && (
          <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </>
        )}
      </g>
    </svg>
  );
}

/** 再現度の観点ごとの色。グラフと凡例で同じ色を使う（隣り合う色の色覚差を検証済み）。 */
const scoreWeightColors = {
  ccip: "#ff2d87",
  pixai: "#00b4fc",
  siglip2: "#ff7a45",
  dinov2: "#7959fc",
  depth: "#16b37e",
} as const;
type ScoreWeightKey = keyof typeof scoreWeightColors;

/** 再現度に占める観点ごとの重み（%）を、1本の帯の割合で描く。 */
export function ScoreWeightsBar({
  weights,
}: {
  weights: readonly { key: ScoreWeightKey; weight: number }[];
}) {
  const clip = useId();
  const starts = weights.map((_, index) =>
    weights.slice(0, index).reduce((sum, item) => sum + item.weight, 0),
  );
  return (
    <svg width="100%" height="16" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect width="100%" height="16" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {weights.map(({ key, weight }, index) => (
          <rect
            key={key}
            x={`${starts[index]}%`}
            width={`${weight}%`}
            height="16"
            fill={scoreWeightColors[key]}
          />
        ))}
        {starts.slice(1).map((start) => (
          <rect
            key={start}
            x={`${start}%`}
            width="2"
            height="16"
            fill="#fff"
            transform="translate(-1 0)"
          />
        ))}
      </g>
    </svg>
  );
}

/** グラフの色と凡例を結び付ける色見本。 */
export function ScoreWeightSwatch({ metric }: { metric: ScoreWeightKey }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect width="12" height="12" rx="3" fill={scoreWeightColors[metric]} />
    </svg>
  );
}
