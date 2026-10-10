import { center } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface CenterProps extends CommonProps {
  axis?: "both" | "inline";
}
const styles = {
  default: center({}),
  both: center({ axis: "both" }),
  inline: center({ axis: "inline" }),
};
export function Center({ ref, ...props }: CenterProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[props.axis ?? "default"]}>
      {props.children}
    </div>
  );
}
