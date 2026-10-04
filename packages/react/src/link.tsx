import type { MouseEventHandler } from "react";
import { link } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface LinkProps extends CommonProps<HTMLAnchorElement> {
  href: string;
  target?: "_self" | "_blank";
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}
export function Link({ ref, ...props }: LinkProps) {
  return (
    <a
      {...domProps(props)}
      ref={ref}
      href={props.href}
      target={props.target}
      rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={props.onClick}
      className={link()}
    >
      {props.children}
    </a>
  );
}
