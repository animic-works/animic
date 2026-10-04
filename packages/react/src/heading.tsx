import { css, cx } from "@animic/styled-system/css";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface HeadingProps extends CommonProps<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size: "sm" | "md" | "lg" | "display";
}
const tags = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } satisfies Record<
  HeadingProps["level"],
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
>;
const sizes = {
  sm: css({ textStyle: "heading.sm" }),
  md: css({ textStyle: "heading.md" }),
  lg: css({ textStyle: "heading.lg" }),
  display: css({ textStyle: "display" }),
};
export function Heading({ ref, ...props }: HeadingProps) {
  const Element = tags[props.level];
  return (
    <Element
      {...domProps(props)}
      ref={ref}
      className={cx(css({ margin: "0", color: "fg.default" }), sizes[props.size])}
    >
      {props.children}
    </Element>
  );
}
