import { stack } from "@animic/styled-system/patterns";
import type { StackProperties } from "@animic/styled-system/patterns";
import type { HTMLAttributes, ReactNode } from "react";

type LayoutElement =
  | "div"
  | "section"
  | "main"
  | "header"
  | "footer"
  | "nav"
  | "ul"
  | "ol"
  | "form"
  | "fieldset";

export type StackProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> &
  StackProperties & { as?: LayoutElement; children?: ReactNode };

// 縦（または横）に一定の間隔で並べる
export function Stack({
  as: Element = "div",
  gap,
  direction,
  align,
  justify,
  ...rest
}: StackProps) {
  return <Element {...rest} className={stack({ gap, direction, align, justify })} />;
}
