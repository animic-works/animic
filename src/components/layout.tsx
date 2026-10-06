import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

// レイアウトはデザインシステムのパターン（stack / cluster / visuallyHidden）に当たる。
// それらはアトミックなCSSで出力され変換モジュールがないため、ここでは同じ指定を style で組み立てる。

type StackElement =
  | "div"
  | "section"
  | "main"
  | "header"
  | "footer"
  | "nav"
  | "ul"
  | "ol"
  | "form"
  | "fieldset";
type ClusterElement = "div" | "ul" | "ol" | "nav" | "header" | "footer" | "p";

type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between";

const ALIGN: Record<Align, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};
const JUSTIFY: Record<Justify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
};

// 間隔はspacingトークン（例: gap="4" → var(--spacing-4)）で指定する
const gapVar = (gap: string) => `var(--spacing-${gap})`;

export type StackProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> & {
  as?: StackElement;
  gap?: string;
  direction?: "column" | "row";
  align?: Align;
  justify?: Justify;
  children?: ReactNode;
};

// 縦（または横）に一定の間隔で並べる
export function Stack({
  as: Element = "div",
  gap = "4",
  direction = "column",
  align,
  justify,
  ...rest
}: StackProps) {
  const style: CSSProperties = {
    display: "flex",
    flexDirection: direction,
    gap: gapVar(gap),
    alignItems: align ? ALIGN[align] : undefined,
    justifyContent: justify ? JUSTIFY[justify] : undefined,
    minWidth: 0,
  };
  return <Element {...rest} style={style} />;
}

export type ClusterProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> & {
  as?: ClusterElement;
  gap?: string;
  align?: Align;
  justify?: Justify;
  nowrap?: boolean;
  children?: ReactNode;
};

// 横に並べ、幅が足りなければ折り返す
export function Cluster({
  as: Element = "div",
  gap = "2",
  align = "center",
  justify,
  nowrap = false,
  ...rest
}: ClusterProps) {
  const style: CSSProperties = {
    display: "flex",
    flexWrap: nowrap ? "nowrap" : "wrap",
    gap: gapVar(gap),
    alignItems: ALIGN[align],
    justifyContent: justify ? JUSTIFY[justify] : undefined,
    minWidth: 0,
  };
  return <Element {...rest} style={style} />;
}

const HIDDEN: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export type VisuallyHiddenProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> & {
  as?: "span" | "div" | "p";
  children: ReactNode;
};

// 画面には出さず、読み上げにだけ伝える文字（接続の状態など）
export function VisuallyHidden({ as: Element = "span", ...rest }: VisuallyHiddenProps) {
  return <Element {...rest} style={HIDDEN} />;
}
