import type { ChangeEventHandler, FocusEventHandler } from "react";
import { Field as ArkField } from "@ark-ui/react/field";
import { input } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface TextareaProps extends Omit<CommonProps<HTMLTextAreaElement>, "children"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  maxLength?: number;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  rows?: number;
}
export function Textarea({ ref, ...props }: TextareaProps) {
  return (
    <ArkField.Textarea
      {...domProps(props)}
      ref={ref}
      className={input({ multiline: true })}
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
      rows={props.rows}
    />
  );
}
