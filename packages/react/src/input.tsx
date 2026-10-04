import type { ChangeEventHandler, FocusEventHandler } from "react";
import { Field as ArkField } from "@ark-ui/react/field";
import { input } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface InputProps extends Omit<CommonProps<HTMLInputElement>, "children"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  maxLength?: number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url" | "search";
  autoComplete?: string;
}
export function Input({ ref, ...props }: InputProps) {
  return (
    <ArkField.Input
      {...domProps(props)}
      ref={ref}
      className={input({})}
      name={props.name}
      value={props.value}
      defaultValue={props.defaultValue}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      required={props.required}
      maxLength={props.maxLength}
      onChange={props.onChange}
      onBlur={props.onBlur}
      type={props.type ?? "text"}
      inputMode={props.inputMode}
      autoComplete={props.autoComplete}
    />
  );
}
