import { center } from "@animic/styled-system/patterns";
import type { CenterProperties } from "@animic/styled-system/patterns";
import type { HTMLAttributes, ReactNode } from "react";

type LayoutElement = "div" | "main" | "section";

export type CenterProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> &
  CenterProperties & { as?: LayoutElement; children?: ReactNode };

// 中身を縦横の中央に置く。fillで画面の高さいっぱいを使う
export function Center({ as: Element = "div", fill, ...rest }: CenterProps) {
  return <Element {...rest} className={center({ fill })} />;
}
