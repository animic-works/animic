import { badge } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export type BadgeProps = CommonProps<HTMLSpanElement> & {
  shape?: "pill" | "rounded";
  size?: "sm" | "md";
} & (
    | {
        appearance?: "standard";
        tone?: "neutral" | "success" | "danger" | "surface" | "inverse" | "highlight";
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
      })}
    >
      {props.children}
    </span>
  );
}
