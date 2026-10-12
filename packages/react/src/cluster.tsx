import { cluster } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface ClusterProps extends CommonProps {
  layout?: "wrap" | "nowrap" | "adaptive" | "adaptive-fill";
  space?: "compact" | "normal";
  justify?: "start" | "center" | "end" | "between";
}
export function Cluster({ ref, ...props }: ClusterProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={cluster({
        layout: props.layout ?? "wrap",
        space: props.space ?? "compact",
        justify: props.justify ?? "start",
      })}
    >
      {props.children}
    </div>
  );
}
