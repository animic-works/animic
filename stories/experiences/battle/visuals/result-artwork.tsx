import { useId, type ReactNode } from "react";
import { useAnimationClock } from "./use-animation-clock";
import { Badge } from "@animic/react/badge";
import { Readout } from "@animic/react/readout";
import { Overlay } from "@animic/react/overlay";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { Stack } from "@animic/react/stack";
import { css, keyframes } from "@animic/styled-system/css";
const layer = css({
  position: "relative",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
});
const scanSweep = keyframes({
  from: { transform: "translateY(0)" },
  to: { transform: "translateY(368px)" },
});
const scanBeam = css({
  animationName: `[${scanSweep}]`,
  animationDuration: "[1800ms]",
  animationTimingFunction: "[cubic-bezier(.5,0,.5,1)]",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]" },
});
const faceCaption = css({
  position: "absolute",
  left: "[24%]",
  top: "[12%]",
  translate: "[0 calc(-100% - 4px)]",
  opacity: 0,
  transitionProperty: "[opacity]",
  transitionDuration: "[500ms]",
  "&[data-active]": { opacity: 1 },
  _motionReduce: { transitionDuration: "[0ms]" },
});
const depthTint = css({ mixBlendMode: "color" });
const modelOverlay = css({
  "&[data-blend=screen]": { mixBlendMode: "screen" },
  "&[data-blend=multiply]": { mixBlendMode: "multiply" },
  opacity: 0,
  transitionProperty: "[opacity]",
  transitionDuration: "[500ms]",
  "&[data-active]": { opacity: 1 },
  _motionReduce: { transitionDuration: "[0ms]" },
});
export function EvaluationOverlay({
  mode,
  modelElapsed,
  image,
  imageAspect,
  faceLabel,
  scanning = false,
  scanElapsed = 0,
}: {
  mode: string | null;
  modelElapsed: number;
  image?: string;
  imageAspect: "portrait" | "square";
  faceLabel: string;
  scanning?: boolean;
  scanElapsed?: number;
}) {
  const gradient = useId(),
    depthGradient = useId(),
    depthFilter = useId(),
    scanGradient = useId(),
    scanGrid = useId();
  const ref = useAnimationClock<SVGSVGElement>(scanElapsed);
  const glow = (1 - Math.cos((scanElapsed / 2000) * Math.PI)) / 2;
  return (
    <div className={layer}>
      <svg
        ref={ref}
        className={layer}
        viewBox="0 0 200 292"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g className={modelOverlay} data-active={scanning || undefined}>
          <defs>
            <linearGradient id={scanGradient} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#00b4fc" stopOpacity="0" />
              <stop offset="80%" stopColor="#00b4fc" stopOpacity=".22" />
              <stop offset="100%" stopColor="#fff" stopOpacity=".95" />
            </linearGradient>
            <pattern id={scanGrid} width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M18 0H0V18" fill="none" stroke="#00b4fc" strokeOpacity=".12" />
            </pattern>
          </defs>
          <rect
            className={scanBeam}
            width="200"
            height="76"
            y="-76"
            fill={`url(#${scanGradient})`}
          />
          <rect width="200" height="292" fill={`url(#${scanGrid})`} />
        </g>
        <g className={modelOverlay} data-active={mode === "ccip" || undefined}>
          <path
            d="M0 0h200v292H0z M48 35v93h104V35z"
            fill="#0b1b2b"
            fillOpacity=".45"
            fillRule="evenodd"
          />
          <rect
            x="48"
            y="35"
            width="104"
            height="93"
            rx="6"
            fill="none"
            stroke="#fddb13"
            strokeWidth="2"
          />
        </g>
        <g className={modelOverlay} data-active={mode === "openpose" || undefined}>
          <g fill="none" strokeWidth="3.2" strokeLinecap="round">
            <path d="M100 60L100 116" stroke="#ff2d87" />
            <path d="M100 72L72 100L60 132" stroke="#ffb200" />
            <path d="M100 72L128 100L140 132" stroke="#16b37e" />
            <path d="M100 116L84 176L80 236" stroke="#00b4fc" />
            <path d="M100 116L116 176L120 236" stroke="#7c5cff" />
            <path d="M100 60L92 48M100 60L108 48" stroke="#fddb13" />
          </g>
          <g fill="#fff" stroke="#0b1b2b" strokeWidth="1.2">
            {[
              [100, 60],
              [100, 72],
              [72, 100],
              [60, 132],
              [128, 100],
              [140, 132],
              [100, 116],
              [84, 176],
              [80, 236],
              [116, 176],
              [120, 236],
              [92, 48],
              [108, 48],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.2" />
            ))}
          </g>
        </g>
        <g
          className={modelOverlay}
          data-active={mode === "dino" || undefined}
          data-blend="multiply"
        >
          {Array.from({ length: 216 }, (_, i) => (
            <rect
              key={i}
              x={((i % 12) * 200) / 12}
              y={(Math.floor(i / 12) * 292) / 18}
              width={200 / 12}
              height={292 / 18}
              fill={i % 3 ? "#00b4fc" : "#ff2d87"}
              opacity={
                Math.min(
                  1,
                  Math.max(0, (modelElapsed - (i % 12) * 25 - Math.floor(i / 12) * 18) / 400),
                ) *
                (0.1 + ((i * 17) % 40) / 100)
              }
            />
          ))}
        </g>
        <g className={modelOverlay} data-active={mode === "depth" || undefined}>
          <defs>
            <filter id={depthFilter}>
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.68" intercept="-.3" />
                <feFuncG type="linear" slope="1.68" intercept="-.3" />
                <feFuncB type="linear" slope="1.68" intercept="-.3" />
              </feComponentTransfer>
              <feGaussianBlur stdDeviation="1" />
            </filter>
            <linearGradient id={depthGradient} x2="0" y2="1">
              <stop stopColor="#1e003c" stopOpacity=".55" />
              <stop offset="55%" stopColor="#ff7828" stopOpacity=".35" />
              <stop offset="100%" stopColor="#ffe678" stopOpacity=".25" />
            </linearGradient>
          </defs>
          {image && (
            <image
              href={image}
              x={imageAspect === "square" ? -46 : 0}
              width={imageAspect === "square" ? 292 : 200}
              height="292"
              preserveAspectRatio="xMidYMid slice"
              filter={`url(#${depthFilter})`}
            />
          )}
          <rect className={depthTint} width="200" height="292" fill={`url(#${depthGradient})`} />
        </g>
        <g
          className={modelOverlay}
          data-blend="screen"
          data-active={mode === "siglip" || mode === "dreamsim" || undefined}
        >
          <defs>
            <radialGradient id={gradient} cy={`${30 + 45 * glow}%`} r="55%">
              <stop
                stopColor={`rgb(${Math.round(255 * glow)} ${Math.round(180 - 135 * glow)} ${Math.round(252 - 117 * glow)})`}
                stopOpacity={0.35 - 0.05 * glow}
              />
              <stop offset="100%" stopColor="#00b4fc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="292" fill={`url(#${gradient})`} />
        </g>
      </svg>
      <div className={faceCaption} data-active={mode === "ccip" || undefined} aria-hidden="true">
        <Badge appearance="annotation">{faceLabel}</Badge>
      </div>
    </div>
  );
}
const entryBand = keyframes({
  "0%": { clipPath: "inset(0 100% 0 0)" },
  "22%, 76%": { clipPath: "inset(0)" },
  "100%": { clipPath: "inset(0 0 0 100%)" },
});
const entryText = keyframes({
  "0%, 14%": { opacity: 0, transform: "translateX(-30vw) skewX(24deg)" },
  "28%": { opacity: 1, transform: "translateX(1.5vw) skewX(-8deg)" },
  "34%, 66%": { opacity: 1, transform: "none" },
  "78%, 100%": { opacity: 0, transform: "translateX(30vw) skewX(24deg)" },
});
const entry = css({
  position: "fixed",
  left: "[-10%]",
  top: "[50%]",
  width: "[120%]",
  height: "[10rem]",
  translate: "[0 -50%]",
  rotate: "[-6deg]",
  animationName: `[${entryBand}]`,
  animationDuration: "[1500ms]",
  animationTimingFunction: "[cubic-bezier(.7,0,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]", opacity: 0 },
});
const entryLabel = css({
  position: "fixed",
  top: "[50%]",
  width: "[100%]",
  translate: "[0 -50%]",
  rotate: "[-6deg]",
  animationName: `[${entryText}]`,
  animationDuration: "[1500ms]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]", opacity: 0 },
});
export function EntryCurtain({
  name,
  last,
  index,
  elapsed,
}: {
  name: string;
  last: boolean;
  index: number;
  elapsed: number;
}) {
  const ref = useAnimationClock<HTMLDivElement>(elapsed);
  return (
    <Overlay>
      <div ref={ref} aria-hidden="true">
        <svg className={entry} preserveAspectRatio="none" viewBox="0 0 100 160">
          <path fill="#00b4fc" d="M0 0h100v160H0z" />
          <path fill="#0b1b2b" d="M0 10h100v140H0z" />
          <path fill="#ff2d87" d="M0 150h100v10H0z" />
        </svg>
        <div className={entryLabel}>
          <Stack align="center" space="tight">
            <Text variant="eyebrow.strong" tone="highlight">
              {last ? "AND THE LAST ONE" : `ENTRY ${String(index).padStart(2, "0")}`}
            </Text>
            <Heading level={2} size="hero">
              <Text variant="display.feedback" tone="inverse">
                {name}
              </Text>
            </Heading>
          </Stack>
        </div>
      </div>
    </Overlay>
  );
}
const scoreIn = keyframes({
  from: { opacity: 0, transform: "translateY(1rem) scale(.95)" },
  to: { opacity: 1, transform: "none" },
});
const submittedIn = keyframes({
  from: { opacity: 0, transform: "translateX(3rem) rotate(4deg) scale(.94)" },
  to: { opacity: 1, transform: "none" },
});
const submitted = css({
  animationName: `[${submittedIn}]`,
  animationDuration: "[700ms]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function SubmittedReveal({ children, elapsed }: { children: ReactNode; elapsed: number }) {
  const ref = useAnimationClock<HTMLDivElement>(elapsed);
  return (
    <div ref={ref} className={submitted}>
      {children}
    </div>
  );
}
const followupIn = keyframes({
  from: { opacity: 0, transform: "translateY(4rem)" },
  to: { opacity: 1, transform: "none" },
});
const followup = css({
  animationName: `[${followupIn}]`,
  animationDuration: "[600ms]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  animationDelay: "[1800ms]",
  "&[data-sequence=actions]": { animationDelay: "[2000ms]" },
  _motionReduce: { animationName: "[none]" },
});
export function ResultFollowupReveal({
  children,
  animate,
  sequence,
}: {
  children: ReactNode;
  animate: boolean;
  sequence: "save" | "actions";
}) {
  return animate ? (
    <div className={followup} data-sequence={sequence}>
      {children}
    </div>
  ) : (
    children
  );
}
const score = css({
  animationName: `[${scoreIn}]`,
  animationDuration: "[600ms]",
  animationTimingFunction: "[cubic-bezier(.2,.9,.3,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function ScoreReveal({ children }: { children: ReactNode }) {
  return <div className={score}>{children}</div>;
}
const stampIn = keyframes({
  from: { opacity: 0, scale: "[2.2]", rotate: "[0deg]" },
  to: { opacity: 1, scale: "[1]", rotate: "[0deg]" },
});
const stamp = css({
  animationName: `[${stampIn}]`,
  animationDuration: "[450ms]",
  animationTimingFunction: "[cubic-bezier(.3,1.6,.5,1)]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
export function RankStamp({ rank }: { rank: number | null }) {
  return (
    <div className={stamp}>
      <Readout
        presentation="stamp"
        tone={rank === 1 ? "primary" : "neutral"}
        label={rank === null ? "NO ENTRY" : rank === 1 ? "TOP" : "RANK"}
        value={rank === null ? "未提出" : `現在 ${rank}位`}
      />
    </div>
  );
}
