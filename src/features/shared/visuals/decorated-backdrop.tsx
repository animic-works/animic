import { useId } from "react";
import { css } from "@animic/styled-system/css";

const background = css({
  position: "fixed",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
});
const decoration = css({
  _artworkCompact: { opacity: 0 },
});
export function DecoratedBackdrop() {
  const grid = useId(),
    dots = useId();
  return (
    <svg className={background} aria-hidden="true">
      <defs>
        <pattern id={grid} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M56 0H0V56" fill="none" stroke="#e6e8ec" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${grid})`} />
      <svg
        className={decoration}
        width="100%"
        height="100%"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id={dots} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="#c3c8d0" />
          </pattern>
        </defs>
        <rect x="0" y="80" width="130" height="190" fill={`url(#${dots})`} opacity="0.8" />
        <rect x="1440" y="600" width="140" height="160" fill={`url(#${dots})`} opacity="0.8" />
        <path
          d="M0 180 90 100 100 104 6 190Z M1150 900 1250 810 1250 840 1180 900Z M1180 300 1220 280 1205 330Z"
          fill="#ff72b9"
        />
        <path
          d="M1380 120 1470 40 1476 44 1386 124Z M420 860 480 810 482 840Z M1215 360 1235 340 1250 372Z"
          fill="#00b4fc"
        />
        <path d="M1440 170 1500 130 1504 134 1446 176Z" fill="#fddb13" />
        <path
          d="M1320 460v30m-15-15h30M260 420v36m-18-18h36M1480 330l120-90M180 640l80-60"
          stroke="#c3c8d0"
          strokeWidth="2"
        />
      </svg>
    </svg>
  );
}
