import { grid } from "@animic/styled-system/patterns";
import type { GridProperties } from "@animic/styled-system/patterns";
import type { HTMLAttributes, ReactNode } from "react";

type LayoutElement = "div" | "ul" | "ol" | "section" | "dl";

export type GridProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> &
  GridProperties & { as?: LayoutElement; children?: ReactNode };

// 格子に並べる。columns（列の数）かminChildWidth（1つの最小幅）を指定する
export function Grid({ as: Element = "div", gap, columns, minChildWidth, ...rest }: GridProps) {
  return <Element {...rest} className={grid({ gap, columns, minChildWidth })} />;
}
