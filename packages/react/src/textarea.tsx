import { useScrollViewport } from "./use-scroll-viewport";
import type { ChangeEventHandler, FocusEventHandler } from "react";
import { Field as ArkField, useFieldContext } from "@ark-ui/react/field";
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
  const { ref: scrollingRef, scrollbars: scrollingBars } = useScrollViewport<HTMLTextAreaElement>(
    props["aria-label"] ?? "入力内容",
    ref,
    props.value ?? props.defaultValue,
  );
  const field = useFieldContext();
  const fieldProps = field?.getTextareaProps();
  return (
    <>
      <ArkField.Textarea
        data-animic-scroll-viewport=""
        {...domProps(props)}
        ref={scrollingRef}
        id={fieldProps?.id ?? props.id}
        aria-labelledby={field?.ids.label ?? props["aria-labelledby"]}
        aria-describedby={field ? fieldProps?.["aria-describedby"] : props["aria-describedby"]}
        aria-errormessage={field ? fieldProps?.["aria-errormessage"] : props["aria-errormessage"]}
        aria-invalid={field ? fieldProps?.["aria-invalid"] : props["aria-invalid"]}
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
      {scrollingBars}
    </>
  );
}
