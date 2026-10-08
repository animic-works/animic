import type { HTMLAttributes, ReactNode } from "react";

import { configVariant } from "./cx";
import surfaceStyles from "./surface.module.css";

type SurfaceElement =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "li"
  | "figure";

type SurfaceVariant = "raised" | "outline" | "sunken" | "inverse" | "accent" | "sticker" | "soft";

export type SurfaceProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> & {
  as?: SurfaceElement;
  variant?: SurfaceVariant;
  padding?: "none" | "sm" | "md" | "lg" | "fluid";
  children?: ReactNode;
};

// 内容をまとめる面（カード・パネル・タイル）
export function Surface({
  as: Element = "div",
  variant = "raised",
  padding = "md",
  ...rest
}: SurfaceProps) {
  return <Element {...rest} className={configVariant(surfaceStyles, { variant, padding })} />;
}
