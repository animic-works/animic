import { visuallyHidden } from "@animic/styled-system/patterns";
import type { HTMLAttributes, ReactNode } from "react";

export type VisuallyHiddenProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> & {
  as?: "span" | "div" | "p";
  children: ReactNode;
};

// 画面には出さず、読み上げにだけ伝える文字（接続の状態など）
export function VisuallyHidden({ as: Element = "span", ...rest }: VisuallyHiddenProps) {
  return <Element {...rest} className={visuallyHidden()} />;
}
