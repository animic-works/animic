import { heading } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface HeadingProps extends CommonProps<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  outlined?: boolean;
  emphasis?: "plain" | "offset";
  size:
    | "statement"
    | "panel"
    | "ordinal"
    | "title"
    | "sm"
    | "md"
    | "lg"
    | "display"
    | "hero"
    | "fluid"
    | "illustrated"
    | "card"
    | "section";
}
const tags = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } satisfies Record<
  HeadingProps["level"],
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
>;
export function Heading({ ref, ...props }: HeadingProps) {
  const Element = tags[props.level];
  return (
    <Element
      {...domProps(props)}
      ref={ref}
      className={heading({ size: props.size, outlined: props.outlined, emphasis: props.emphasis })}
    >
      {props.children}
    </Element>
  );
}
