import { grid } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface GridProps extends CommonProps {
  columns: 1 | 2 | 3 | 4;
  collapse?: "progressive" | "single" | "none";
  space?: "compact" | "normal" | "section";
}
export function Grid({ ref, ...props }: GridProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={grid({
        columns: `${props.columns}`,
        space: props.space ?? "normal",
        collapse: props.collapse ?? "progressive",
      })}
    >
      <div data-animic-grid-layout="">{props.children}</div>
    </div>
  );
}
