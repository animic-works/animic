import { cluster } from "@animic/styled-system/patterns";
import type { ClusterProperties } from "@animic/styled-system/patterns";
import type { HTMLAttributes, ReactNode } from "react";

type LayoutElement = "div" | "ul" | "ol" | "nav" | "header" | "footer" | "p";

export type ClusterProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> &
  ClusterProperties & { as?: LayoutElement; children?: ReactNode };

// 横に並べ、幅が足りなければ折り返す
export function Cluster({
  as: Element = "div",
  gap,
  align,
  justify,
  nowrap,
  ...rest
}: ClusterProps) {
  return <Element {...rest} className={cluster({ gap, align, justify, nowrap })} />;
}
