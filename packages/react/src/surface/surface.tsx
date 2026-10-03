import { surface } from "@animic/styled-system/recipes";
import type { SurfaceVariantProps } from "@animic/styled-system/recipes";
import type { HTMLAttributes, ReactNode } from "react";

type SurfaceElement =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "li"
  | "figure";

export type SurfaceProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> &
  SurfaceVariantProps & {
    as?: SurfaceElement;
    children?: ReactNode;
  };

// 内容をまとめる面（カード・パネル・タイル）
export function Surface({ as: Element = "div", variant, padding, ...rest }: SurfaceProps) {
  return <Element {...rest} className={surface({ variant, padding })} />;
}
