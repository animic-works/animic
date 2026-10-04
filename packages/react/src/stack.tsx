import { stack } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface StackProps extends CommonProps {
  space?: "compact" | "normal" | "section";
  align?: "stretch" | "start" | "center";
}
const styles = {
  default: {
    default: stack({}),
    stretch: stack({ align: "stretch" }),
    start: stack({ align: "start" }),
    center: stack({ align: "center" }),
  },
  compact: {
    default: stack({ space: "compact" }),
    stretch: stack({ space: "compact", align: "stretch" }),
    start: stack({ space: "compact", align: "start" }),
    center: stack({ space: "compact", align: "center" }),
  },
  normal: {
    default: stack({ space: "normal" }),
    stretch: stack({ space: "normal", align: "stretch" }),
    start: stack({ space: "normal", align: "start" }),
    center: stack({ space: "normal", align: "center" }),
  },
  section: {
    default: stack({ space: "section" }),
    stretch: stack({ space: "section", align: "stretch" }),
    start: stack({ space: "section", align: "start" }),
    center: stack({ space: "section", align: "center" }),
  },
};
export function Stack({ ref, ...props }: StackProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={styles[props.space ?? "default"][props.align ?? "default"]}
    >
      {props.children}
    </div>
  );
}
