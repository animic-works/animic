import { statusLabel } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export function StatusLabel({
  ref,
  tone,
  appearance,
  ...props
}: CommonProps<HTMLSpanElement> & {
  tone?: "neutral" | "success";
  appearance?: "inline" | "badge";
}) {
  return (
    <span {...domProps(props)} ref={ref} className={statusLabel({ tone, appearance })}>
      {props.children}
    </span>
  );
}
