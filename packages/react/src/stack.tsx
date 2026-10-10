import { stack } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface StackProps extends CommonProps {
  space?: "compact" | "normal" | "section" | "spacious" | "fluid" | "tight";
  align?: "stretch" | "start" | "center";
  fill?: boolean;
  justify?: "start" | "center" | "between";
}
export function Stack({ ref, ...props }: StackProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={stack({
        space: props.space ?? "normal",
        align: props.align ?? "stretch",
        fill: props.fill,
        justify: props.justify,
      })}
    >
      {props.children}
    </div>
  );
}
