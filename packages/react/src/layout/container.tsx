import { container } from "@animic/styled-system/patterns";
import type { ContainerProperties } from "@animic/styled-system/patterns";
import type { HTMLAttributes, ReactNode } from "react";

type LayoutElement = "div" | "main" | "section" | "header" | "footer";

export type ContainerProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> &
  ContainerProperties & { as?: LayoutElement; children?: ReactNode };

// 内容の最大幅を決めて中央に置く
export function Container({ as: Element = "div", size, ...rest }: ContainerProps) {
  return <Element {...rest} className={container({ size })} />;
}
