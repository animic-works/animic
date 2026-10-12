import { actionGroup } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface ActionGroupProps extends CommonProps {
  layout?: "inline" | "paired" | "adaptive" | "fill" | "responsive" | "confirm";
  align?: "start" | "center" | "end";
}
export function ActionGroup({ ref, ...props }: ActionGroupProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={actionGroup({ layout: props.layout ?? "inline", align: props.align ?? "start" })}
    >
      {props.children}
    </div>
  );
}
