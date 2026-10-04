import { cluster } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface ClusterProps extends CommonProps {
  space?: "compact" | "normal";
  justify?: "start" | "center" | "end" | "between";
}
const styles = {
  default: {
    default: cluster({}),
    start: cluster({ justify: "start" }),
    center: cluster({ justify: "center" }),
    end: cluster({ justify: "end" }),
    between: cluster({ justify: "between" }),
  },
  compact: {
    default: cluster({ space: "compact" }),
    start: cluster({ space: "compact", justify: "start" }),
    center: cluster({ space: "compact", justify: "center" }),
    end: cluster({ space: "compact", justify: "end" }),
    between: cluster({ space: "compact", justify: "between" }),
  },
  normal: {
    default: cluster({ space: "normal" }),
    start: cluster({ space: "normal", justify: "start" }),
    center: cluster({ space: "normal", justify: "center" }),
    end: cluster({ space: "normal", justify: "end" }),
    between: cluster({ space: "normal", justify: "between" }),
  },
};
export function Cluster({ ref, ...props }: ClusterProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={styles[props.space ?? "default"][props.justify ?? "default"]}
    >
      {props.children}
    </div>
  );
}
