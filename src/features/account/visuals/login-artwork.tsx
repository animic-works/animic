import { useId, type ReactNode } from "react";
import { css, keyframes } from "@animic/styled-system/css";

const logo = css({
  width: "[min(100%, 15rem)]",
  height: "[auto]",
  _artworkCompact: { '&[data-compact-hidden="true"]': { width: "[0]", height: "[0]", opacity: 0 } },
});
const compactLogo = css({ width: "[8rem]", height: "[auto]" });
const scene = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  overflow: "visible",
});
const float = keyframes({ "50%": { transform: "translateY(-8px)" } });
const floating = css({
  animationName: `[${float}]`,
  animationDuration: "[6s]",
  animationIterationCount: "infinite",
  animationTimingFunction: "[ease-in-out]",
  _motionReduce: { animationName: "[none]" },
});
const enter = keyframes({
  from: { opacity: 0, transform: "translateX(2.5rem) rotate(2deg)" },
  to: { opacity: 1, transform: "none" },
});
const sheetEnter = keyframes({
  from: { opacity: 0, transform: "translateY(2.5rem)" },
  to: { opacity: 1, transform: "none" },
});
const step = css({
  animationName: `[${enter}]`,
  animationDuration: "[500ms]",
  animationTimingFunction: "[cubic-bezier(0.2, 0.9, 0.3, 1.15)]",
  animationFillMode: "both",
  _artworkCompact: { animationName: `[${sheetEnter}]`, animationDuration: "[400ms]" },
  _motionReduce: { animationName: "[none]" },
  '&[data-animate="false"]': { animationName: "[none]" },
});

export function LoginLogo({
  size = "standard",
  compactHidden = false,
}: {
  size?: "compact" | "standard";
  compactHidden?: boolean;
}) {
  if (size === "compact")
    return (
      <svg className={compactLogo} viewBox="0 0 2078 607" role="img" aria-label="Animic">
        <image href="/animic-logo.svg" width="2078" height="607" />
      </svg>
    );
  return (
    <svg
      className={logo}
      data-compact-hidden={compactHidden || undefined}
      viewBox="0 0 2078 607"
      role="img"
      aria-label="Animic"
    >
      <image href="/animic-logo.svg" width="2078" height="607" />
    </svg>
  );
}
export function LoginArtwork() {
  const shadow = useId();
  return (
    <svg
      className={scene}
      viewBox="0 0 390 428"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id={shadow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="6" dy="14" stdDeviation="0" floodColor="#ff72b9" floodOpacity="0.9" />
        </filter>
      </defs>
      <path d="M330 0h10L183 428h-10Z" fill="#00b4fc" />
      <path d="M348 0h100L293 428H191Z" fill="#ffe4f1" />
      <path d="M444 0h5L294 428h-5Z" fill="#fddb13" />
      <g transform="translate(-40 82) rotate(-10 220 147)">
        <image
          className={floating}
          href="/images/hero-character.webp"
          width="465"
          height="305"
          filter={`url(#${shadow})`}
        />
      </g>
      <path d="M49 94Q49 113 69 114Q49 115 49 134Q48 115 30 114Q48 113 49 94" fill="#00b4fc" />
      <path d="M340 78Q340 96 358 97Q340 98 340 116Q339 98 322 97Q339 96 340 78" fill="#fddb13" />
    </svg>
  );
}
export function LoginStep({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return (
    <div className={step} data-animate={active}>
      {children}
    </div>
  );
}
