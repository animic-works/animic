import { text } from "@animic/styled-system/recipes";
import type { TextVariantProps } from "@animic/styled-system/recipes";
import type { HTMLAttributes, ReactNode } from "react";

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
type HeadingLevel = 1 | 2 | 3 | 4;

type BaseProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "color"> &
  TextVariantProps & { children?: ReactNode };

export type TextProps = BaseProps & {
  /** 出力する要素。意味（段落・強調など）で選び、見た目はvariantで決める */
  as?: TextElement;
};

// 本文・注記などの文字
export function Text({ as: Element = "p", variant, tone, align, shadow, ...rest }: TextProps) {
  return <Element {...rest} className={text({ variant, tone, align, shadow })} />;
}

export type HeadingProps = BaseProps & {
  /** 見出しの階層（h1〜h4）。見た目の大きさはvariantで別に選べる */
  level?: HeadingLevel;
};

const HEADING_VARIANT = { 1: "heading-lg", 2: "heading-md", 3: "heading-sm", 4: "label" } as const;

// 見出し。階層と見た目を分けて選べる（例: 画面の唯一の見出しでも中くらいの大きさにする）
export function Heading({ level = 2, variant, tone, align, shadow, ...rest }: HeadingProps) {
  const Element = `h${level}` as const;
  return (
    <Element
      {...rest}
      className={text({ variant: variant ?? HEADING_VARIANT[level], tone, align, shadow })}
    />
  );
}
