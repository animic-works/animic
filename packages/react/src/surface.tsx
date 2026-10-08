import { surface } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface SurfaceProps extends CommonProps {
  accent?: "primary" | "secondary" | "highlight";
  appearance?:
    | "inverse"
    | "tinted"
    | "sheet"
    | "subtle"
    | "plain"
    | "adaptive"
    | "raised"
    | "framed"
    | "card"
    | "illustrated"
    | "primary"
    | "secondary"
    | "highlight";
  padding?:
    | "content"
    | "section"
    | "frame"
    | "compact-only"
    | "tight"
    | "small"
    | "inset"
    | "compact"
    | "normal"
    | "spacious"
    | "fluid";
}
export function Surface({ ref, ...props }: SurfaceProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={surface({
        appearance: props.appearance,
        padding: props.padding,
        accent: props.accent,
      })}
    >
      {props.children}
    </div>
  );
}
