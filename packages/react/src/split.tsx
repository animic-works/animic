import { split } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface SplitProps extends CommonProps {
  layout: "equal" | "main-aside" | "aside-main";
}
const styles = {
  equal: split({ layout: "equal" }),
  "main-aside": split({ layout: "main-aside" }),
  "aside-main": split({ layout: "aside-main" }),
};
export function Split({ ref, ...props }: SplitProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[props.layout]}>
      <div data-animic-split-layout="">{props.children}</div>
    </div>
  );
}
