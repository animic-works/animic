import type { ReactNode } from "react";
import { page } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface PageProps extends CommonProps {
  decoration?: ReactNode;
  scroll?: "continuous" | "sections";
}
const className = page();
export function Page({ ref, scroll = "continuous", ...props }: PageProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      data-animic-root
      data-animic-page
      data-animic-page-scroll={scroll}
      className={className}
      // 初回描画前に計測するナビの高さは、サーバーのstyle属性には含まれない。
      suppressHydrationWarning
    >
      {props.decoration && (
        <div data-animic-page-background aria-hidden="true" inert>
          {props.decoration}
        </div>
      )}
      {props.children}
    </div>
  );
}
