import { badge } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface BadgeProps extends CommonProps<HTMLSpanElement> {
  tone?: "neutral" | "success" | "danger";
}
export function Badge({ ref, ...props }: BadgeProps) {
  return (
    <span {...domProps(props)} ref={ref} className={badge({ tone: props.tone })}>
      {props.children}
    </span>
  );
}
