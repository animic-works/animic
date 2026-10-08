import type { MouseEventHandler } from "react";
import { button, link } from "@animic/styled-system/recipes";
import { ActionContent, type ActionProps } from "./action-content";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface LinkProps extends CommonProps<HTMLAnchorElement> {
  href: string;
  target?: "_self" | "_blank";
  appearance?: "back" | "inverse" | "text" | "quiet" | "navigation" | "scroll" | "subtle";
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}
export function Link({ ref, ...props }: LinkProps) {
  return (
    <a
      {...domProps(props)}
      ref={ref}
      href={props.href}
      suppressHydrationWarning={props.appearance === "navigation"}
      target={props.target}
      rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={props.onClick}
      className={link({ appearance: props.appearance })}
    >
      {props.children}
    </a>
  );
}

export interface ButtonLinkProps extends CommonProps<HTMLAnchorElement>, ActionProps {
  href: string;
  target?: "_self" | "_blank";
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}
export function ButtonLink({ ref, ...props }: ButtonLinkProps) {
  return (
    <a
      {...domProps(props)}
      ref={ref}
      href={props.href}
      target={props.target}
      rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={props.onClick}
      className={button({
        appearance: props.appearance,
        size: props.size,
        shape: props.shape,
        tone: props.tone,
        prominence: props.prominence,
        icons: Boolean(props.leadingIcon || props.trailingIcon),
        responsiveLabel: Boolean(props.compactLabel),
      })}
    >
      <ActionContent {...props} />
    </a>
  );
}
