import { useId } from "react";
import { css } from "@animic/styled-system/css";
const background = css({
  position: "absolute",
  inset: "[0]",
  width: "[100%]",
  height: "[100%]",
  pointerEvents: "none",
});
export function GridBackdrop() {
  const id = useId();
  return (
    <svg className={background} aria-hidden="true">
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0.5 56V0.5H56" fill="none" stroke="#e6e8ec" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
