import type { MouseEventHandler } from "react";
import { iconButton } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface IconButtonProps extends CommonProps<HTMLButtonElement> {
  label: string;
  appearance?: "standard" | "quiet";
  size?: "xs" | "sm" | "md" | "lg";
  shape?: "rounded" | "circle";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
export function IconButton({ ref, ...props }: IconButtonProps) {
  return (
    <button
      {...domProps(props)}
      ref={ref}
      type="button"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className={iconButton({ appearance: props.appearance, size: props.size, shape: props.shape })}
    >
      {props.children}
    </button>
  );
}
