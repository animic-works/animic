import type { ReactNode } from "react";
export interface ActionProps {
  tone?: "neutral" | "green" | "yellow" | "cyan";
  prominence?: "standard" | "raised" | "lifted";
  shape?: "rounded" | "pill";
  appearance?: "soft" | "overlay" | "outlined" | "quiet" | "primary" | "secondary" | "inverse";
  size?: "xs" | "sm" | "compact" | "md" | "lg" | "hero" | "nav";
  compactLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}
export function ActionContent(
  props: Pick<ActionProps, "leadingIcon" | "trailingIcon" | "compactLabel"> & {
    children?: ReactNode;
  },
) {
  return (
    <>
      {props.leadingIcon && (
        <span data-animic-button-icon="start" aria-hidden="true">
          {props.leadingIcon}
        </span>
      )}
      {props.compactLabel ? (
        <>
          <span data-animic-button-label="full">{props.children}</span>
          <span data-animic-button-label="compact">{props.compactLabel}</span>
        </>
      ) : props.leadingIcon || props.trailingIcon ? (
        <span data-animic-button-label>{props.children}</span>
      ) : (
        props.children
      )}
      {props.trailingIcon && (
        <span data-animic-button-icon="end" aria-hidden="true">
          {props.trailingIcon}
        </span>
      )}
    </>
  );
}
