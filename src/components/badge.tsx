import type { HTMLAttributes, ReactNode } from "react";

import { configVariant, cx } from "./cx";
import badgeStyles from "./badge.module.css";

export type BadgeTone = "neutral" | "accent" | "info" | "success" | "warning" | "danger";

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "className" | "style"> & {
  tone?: BadgeTone;
  variant?: "subtle" | "solid" | "outline";
  size?: "sm" | "md";
  children: ReactNode;
};

// 状態や分類を示す小さなラベル（ホスト・準備OKなど）
export function Badge({ tone = "neutral", variant = "subtle", size = "md", ...rest }: BadgeProps) {
  const className = cx(
    configVariant(badgeStyles, { tone, variant, size }),
    // 黄色の塗りは文字を黒にする（黄色の上の白は読みにくい）
    tone === "warning" &&
      variant === "subtle" &&
      badgeStyles.compound__tone_warning__variant_subtle,
  );
  return <span {...rest} className={className} />;
}
