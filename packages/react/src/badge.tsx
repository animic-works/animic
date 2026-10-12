import { badge } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export type BadgeProps = CommonProps<HTMLSpanElement> & {
  shape?: "pill" | "rounded";
  size?: "xs" | "sm" | "md";
  /** 札を親の幅までに収め、最初の要素（名前など）だけを「…」で縮める。後ろの要素（敬称など）は残す。 */
  truncate?: boolean;
} & (
    | {
        appearance?: "standard";
        tone?: "neutral" | "success" | "danger" | "surface" | "inverse" | "highlight" | "primary";
      }
    | { appearance: "glass" | "sticker" | "stamp" | "translucent" | "annotation"; tone?: never }
  );
export function Badge({ ref, ...props }: BadgeProps) {
  return (
    <span
      {...domProps(props)}
      ref={ref}
      className={badge({
        appearance: props.appearance,
        tone: props.tone,
        size: props.size,
        shape: props.shape,
        truncate: props.truncate,
      })}
    >
      {props.children}
    </span>
  );
}
