import type { MouseEventHandler } from "react";
import { button } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface ButtonProps extends CommonProps<HTMLButtonElement> {
  appearance?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  form?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
export function Button({ ref, type = "button", ...props }: ButtonProps) {
  return (
    <button
      {...domProps(props)}
      ref={ref}
      className={button({ appearance: props.appearance, size: props.size })}
      type={type === "submit" ? "submit" : type === "reset" ? "reset" : "button"}
      disabled={props.disabled || props.loading}
      aria-busy={props.loading || undefined}
      name={props.name}
      value={props.value}
      form={props.form}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
