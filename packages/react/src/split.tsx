import { Children, type ReactNode } from "react";
import { split } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface SplitProps extends CommonProps {
  layout:
    | "balanced-aside"
    | "equal"
    | "balanced"
    | "main-aside"
    | "aside-main"
    | "content-media"
    | "content-intrinsic";
  header?: ReactNode;
  align?: "start" | "stretch";
  collapseOrder?: "normal" | "reverse";
  space?: "compact" | "normal" | "section";
}
export function Split({ ref, ...props }: SplitProps) {
  const items = Children.toArray(props.children);
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={split({
        layout: props.layout,
        align: props.align,
        collapseOrder: props.collapseOrder ?? "normal",
        space: props.space ?? "normal",
      })}
    >
      <div data-animic-split-layout="">
        {props.header != null && <div data-animic-split-header>{props.header}</div>}
        {items.map((item, index) => (
          <div
            key={index}
            data-animic-split-first={index === 0 ? "" : undefined}
            data-animic-split-second={index === 1 ? "" : undefined}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
