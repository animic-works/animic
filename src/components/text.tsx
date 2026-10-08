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

type HeadingLevel = 1 | 2 | 3 | 4;

export type HeadingProps = BaseProps & {
  /** 見出しの階層（h1〜h4）。見た目の大きさはvariantで別に選べる */
  level?: HeadingLevel;
};

const HEADING_VARIANT = { 1: "heading-lg", 2: "heading-md", 3: "heading-sm", 4: "label" } as const;

// 見出し。階層と見た目を分けて選べる（例: 節の見出しを小さく見せる）
export function Heading({
  level = 2,
  variant,
  tone,
  align = "start",
  shadow,
  ...rest
}: HeadingProps) {
  const Element = `h${level}` as const;
  return (
    <Element
      {...rest}
      className={configVariant(textStyles, {
        variant: variant ?? HEADING_VARIANT[level],
        tone,
        align,
        shadow,
      })}
    />
  );
}
