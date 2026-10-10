import { useId, type ReactNode } from "react";
import { css, keyframes } from "@animic/styled-system/css";
import { Overlay } from "@animic/react/overlay";
import { Dialog } from "@animic/react/dialog";
const enter = keyframes({
  from: { transform: "translateX(-120%) skewX(-18deg)" },
  to: { transform: "translateX(0) skewX(-18deg)" },
});
const uncover = keyframes({
  from: { transform: "translateX(0) skewX(-18deg)" },
  to: { transform: "translateX(120%) skewX(-18deg)" },
});
const disappear = keyframes({
  from: { opacity: 1, scale: "[1]" },
  to: { opacity: 0, scale: "[0.4]", rotate: "[20deg]" },
});
const pop = keyframes({
  from: { scale: "[0]", rotate: "[-30deg]" },
  to: { scale: "[1]", rotate: "[0deg]" },
});
const bands = css({
  position: "absolute",
  top: "[-25%]",
  left: "[-30%]",
  width: "[160%]",
  _artworkVertical: { left: "[calc(-30% - 30vh)]", width: "[calc(160% + 60vh)]" },
  height: "[150%]",
  transform: "translateX(-120%) skewX(-18deg)",
  animationName: `[${enter}]`,
  animationDuration: "[750ms]",
  animationTimingFunction: "[cubic-bezier(0.65, 0, 0.35, 1)]",
  animationFillMode: "both",
  "&:nth-child(2)": { animationDelay: "[140ms]" },
  "&:nth-child(3)": { animationDelay: "[280ms]" },
  "&[data-phase=uncover]": { animationName: `[${uncover}]`, animationDelay: "[530ms]" },
  "&[data-phase=uncover]:nth-child(2)": { animationDelay: "[390ms]" },
  "&[data-phase=uncover]:nth-child(3)": { animationDelay: "[250ms]" },
  _motionReduce: { animationName: "[none]", transform: "none" },
});
const logo = css({
  position: "absolute",
  top: "[50%]",
  left: "[50%]",
  width: "[clamp(6rem, 18vw, 9rem)]",
  translate: "[-50% -50%]",
  scale: "[0]",
  animationName: `[${pop}]`,
  animationDuration: "[500ms]",
  animationTimingFunction: "[cubic-bezier(0.3, 1.6, 0.5, 1)]",
  animationDelay: "[900ms]",
  animationFillMode: "both",
  "&[data-phase=uncover]": {
    animationName: `[${disappear}]`,
    animationDelay: "[0ms]",
    animationDuration: "[350ms]",
    animationTimingFunction: "[ease-in]",
  },
  _motionReduce: { animationName: "[none]", scale: "[1]" },
});
const messageEnter = keyframes({
  from: { opacity: 0, transform: "translateY(1.5rem)" },
  to: { opacity: 1, transform: "none" },
});
const messageExit = keyframes({
  to: { opacity: 0, transform: "scale(0.9)" },
});
const message = css({
  position: "absolute",
  top: "[50%]",
  left: "[50%]",
  width: "[min(90%, 30rem)]",
  translate: "[-50% -50%]",
  animationName: `[${messageEnter}]`,
  animationDuration: "[400ms]",
  animationDelay: "[950ms]",
  animationTimingFunction: "[ease-out]",
  animationFillMode: "both",
  "&[data-phase=uncover]": {
    animationName: `[${messageExit}]`,
    animationDelay: "[0ms]",
    animationDuration: "[350ms]",
    animationTimingFunction: "[ease-in]",
  },
});
const actionEnter = css({
  animationName: `[${messageEnter}]`,
  animationDuration: "[400ms]",
  animationDelay: "[950ms]",
  animationTimingFunction: "[ease-out]",
  animationFillMode: "both",
  _motionReduce: { animationName: "[none]" },
});
const ignoreDismiss = () => {};
const sceneFrame = css({ position: "absolute", inset: "[0]", overflow: "hidden" });
export function PageTransition({
  phase,
  children,
  action,
  onExitComplete,
}: {
  phase: "cover" | "uncover";
  children?: ReactNode;
  action?: ReactNode;
  onExitComplete: () => void;
}) {
  const shadow = useId();
  const scene = (
    <div className={sceneFrame}>
      <svg
        onAnimationEnd={(event) => {
          if (phase === "uncover" && event.target === event.currentTarget) onExitComplete();
        }}
        data-phase={phase}
        className={bands}
        preserveAspectRatio="none"
      >
        <rect width="100%" height="100%" fill="#00b4fc" />
      </svg>
      <svg data-phase={phase} className={bands} preserveAspectRatio="none">
        <rect width="100%" height="100%" fill="#fddb13" />
      </svg>
      <svg data-phase={phase} className={bands} preserveAspectRatio="none">
        <rect width="100%" height="100%" fill="#ff2d87" />
      </svg>
      {children ? (
        <div className={message} data-phase={phase}>
          {children}
        </div>
      ) : (
        <svg data-phase={phase} className={logo} viewBox="0 0 256 256">
          <defs>
            <filter
              id={shadow}
              x="-10%"
              y="-10%"
              width="120%"
              height="130%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow
                dx="0"
                dy="18"
                stdDeviation="0"
                floodColor="#0b1b2b"
                floodOpacity="0.25"
              />
            </filter>
          </defs>
          <image href="/favicon.svg" width="256" height="256" filter={`url(#${shadow})`} />
        </svg>
      )}
    </div>
  );
  return children ? (
    <Dialog
      open
      onOpenChange={ignoreDismiss}
      title="ルームへ移動"
      titleVisibility="hidden"
      closeButton={false}
      dismissible={false}
      appearance="transparent"
      presentation="fullscreen"
      footer={action ? <div className={actionEnter}>{action}</div> : undefined}
    >
      {scene}
    </Dialog>
  ) : (
    <Overlay>{scene}</Overlay>
  );
}
