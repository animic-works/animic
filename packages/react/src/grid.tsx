import { grid } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface GridProps extends CommonProps {
  columns: 1 | 2 | 3 | 4;
  space?: "normal" | "section";
}
const styles = {
  "1": {
    default: grid({ columns: "1" }),
    normal: grid({ columns: "1", space: "normal" }),
    section: grid({ columns: "1", space: "section" }),
  },
  "2": {
    default: grid({ columns: "2" }),
    normal: grid({ columns: "2", space: "normal" }),
    section: grid({ columns: "2", space: "section" }),
  },
  "3": {
    default: grid({ columns: "3" }),
    normal: grid({ columns: "3", space: "normal" }),
    section: grid({ columns: "3", space: "section" }),
  },
  "4": {
    default: grid({ columns: "4" }),
    normal: grid({ columns: "4", space: "normal" }),
    section: grid({ columns: "4", space: "section" }),
  },
};
export function Grid({ ref, ...props }: GridProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[props.columns][props.space ?? "default"]}>
      <div data-animic-grid-layout="">{props.children}</div>
    </div>
  );
}
