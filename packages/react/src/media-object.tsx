import type { ReactNode } from "react";
import { mediaObject } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface MediaObjectProps extends CommonProps {
  media: ReactNode;
  actions?: ReactNode;
  layout?: "inline" | "stacked" | "adaptive";
}
export function MediaObject({ ref, ...props }: MediaObjectProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={mediaObject({ layout: props.layout ?? "inline" })}
    >
      <div data-animic-media-layout>
        <div data-animic-media>{props.media}</div>
        <div data-animic-media-content>{props.children}</div>
        {props.actions && <div data-animic-media-actions>{props.actions}</div>}
      </div>
    </div>
  );
}
