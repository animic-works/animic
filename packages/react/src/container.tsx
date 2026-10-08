import { container } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface ContainerProps extends CommonProps {
  size: "narrow" | "summary" | "reading" | "wide";
  gutter?: "page" | "none";
}
const styles = {
  page: {
    narrow: container({ size: "narrow" }),
    summary: container({ size: "summary" }),
    reading: container({ size: "reading" }),
    wide: container({ size: "wide" }),
  },
  none: {
    narrow: container({ size: "narrow", gutter: "none" }),
    summary: container({ size: "summary", gutter: "none" }),
    reading: container({ size: "reading", gutter: "none" }),
    wide: container({ size: "wide", gutter: "none" }),
  },
};
export function Container({ ref, ...props }: ContainerProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[props.gutter ?? "page"][props.size]}>
      {props.children}
    </div>
  );
}
