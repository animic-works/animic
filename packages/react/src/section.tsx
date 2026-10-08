import type { ReactNode } from "react";
import { section } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface SectionProps extends CommonProps<HTMLElement> {
  snap?: "start" | "none";
  decoration?: ReactNode;
  navigation?: ReactNode;
  footer?: ReactNode;
  height?: "content" | "viewport";
  align?: "start" | "center" | "stretch";
  inset?: "none" | "navigation" | "navigation-wide";
}
export function Section({ ref, ...props }: SectionProps) {
  return (
    <section
      {...domProps(props)}
      ref={ref}
      className={section({
        footer: props.footer != null,
        snap: props.snap,
        height: props.height ?? "viewport",
        align: props.align ?? "center",
        inset: props.inset ?? "none",
      })}
    >
      {props.decoration && (
        <div data-animic-section-background aria-hidden="true" inert>
          {props.decoration}
        </div>
      )}
      <div data-animic-section-content>{props.children}</div>
      {props.navigation && <div data-animic-section-navigation>{props.navigation}</div>}
      {props.footer && <div data-animic-section-footer>{props.footer}</div>}
    </section>
  );
}
