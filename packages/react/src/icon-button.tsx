import { buttonState, blockButtonEvent } from "./button-state";
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
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
export function IconButton({ ref, ...props }: IconButtonProps) {
  const state = buttonState(props);
  return (
    <button
      {...domProps(props)}
      ref={ref}
      type="button"
      aria-label={props.label}
      {...state.attributes}
      onClick={(event) => {
        if (!blockButtonEvent(event, state.blocked)) props.onClick?.(event);
      }}
      className={iconButton({ appearance: props.appearance, size: props.size, shape: props.shape })}
    >
      {props.children}
    </button>
  );
}
