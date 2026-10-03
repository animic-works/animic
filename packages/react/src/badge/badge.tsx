import { badge } from "@animic/styled-system/recipes";
import type { BadgeVariantProps } from "@animic/styled-system/recipes";
import type { HTMLAttributes, ReactNode } from "react";

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "className" | "style"> &
  BadgeVariantProps & { children: ReactNode };

// 状態や分類を示す小さなラベル（ホスト・準備OKなど）
export function Badge({ tone, variant, size, ...rest }: BadgeProps) {
  return <span {...rest} className={badge({ tone, variant, size })} />;
}
