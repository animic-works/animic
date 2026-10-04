import { container } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface ContainerProps extends CommonProps {
  size: "narrow" | "reading" | "wide";
}
const styles = {
  narrow: container({ size: "narrow" }),
  reading: container({ size: "reading" }),
  wide: container({ size: "wide" }),
};
export function Container({ ref, ...props }: ContainerProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[props.size]}>
      {props.children}
    </div>
  );
}
