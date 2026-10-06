import type { HTMLAttributes, ReactNode } from "react";

import { configVariant } from "./cx";
import textStyles from "./text.module.css";

type TextElement =
  | "p"
  | "span"
  | "div"
  | "strong"
  | "b"
  | "small"
  | "dt"
  | "dd"
  | "figcaption"
  | "em"
  | "code"
  | "output";

type TextVariant =
  | "display"
  | "display-sm"
  | "hero-title"
  | "lead"
  | "section-title"
  | "verdict"
  | "heading-lg"
  | "heading-md"
  | "heading-sm"
  | "body"
  | "body-sm"
  | "label"
  | "note"
  | "caption"
  | "eyebrow"
  | "code";
type TextTone =
  | "default"
  | "muted"
  | "subtle"
  | "faint"
  | "accent"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "inverse";

type BaseProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "color"> & {
  variant?: TextVariant;
  tone?: TextTone;
  align?: "start" | "center" | "end";
  shadow?: "pink" | "cyan";
  children?: ReactNode;
};

export type TextProps = BaseProps & {
  /** 出力する要素。意味（段落・強調など）で選び、見た目はvariantで決める */
  as?: TextElement;
};

// 本文・注記などの文字
export function Text({
  as: Element = "p",
  variant = "body",
  tone,
  align = "start",
  shadow,
  ...rest
}: TextProps) {
  return (
    <Element {...rest} className={configVariant(textStyles, { variant, tone, align, shadow })} />
  );
}
