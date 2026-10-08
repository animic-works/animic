import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import { ActionContent, type ActionProps } from "./action-content";
import { button } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface ButtonProps extends CommonProps<HTMLButtonElement>, ActionProps {
  feedback?: "press";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  form?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
export function Button({ ref, type = "button", ...props }: ButtonProps) {
  const [pressing, setPressing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      {...domProps(props)}
      ref={ref}
      className={button({
        pressing,
        tone: props.tone,
        prominence: props.prominence,
        shape: props.shape,
        appearance: props.appearance,
        size: props.size,
        icons: Boolean(props.leadingIcon || props.trailingIcon),
        responsiveLabel: Boolean(props.compactLabel),
      })}
      type={type === "submit" ? "submit" : type === "reset" ? "reset" : "button"}
      disabled={props.disabled || props.loading}
      aria-busy={props.loading || undefined}
      name={props.name}
      value={props.value}
      form={props.form}
      onClick={(event) => {
        if (props.feedback === "press") {
          clearTimeout(timer.current);
          setPressing(true);
          timer.current = setTimeout(() => setPressing(false), 350);
        }
        props.onClick?.(event);
      }}
    >
      <ActionContent {...props} />
    </button>
  );
}
