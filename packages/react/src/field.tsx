import { Field as ArkField } from "@ark-ui/react/field";
import { field } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface FieldProps extends CommonProps {
  messageLayout?: "stacked" | "status";
  messageAlign?: "start" | "center";
  label: string;
  labelVisibility?: "visible" | "hidden";
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}
export function Field({ ref, ...props }: FieldProps) {
  const classes = field({
    messageLayout: props.messageLayout,
    labelVisibility: props.labelVisibility,
    messageAlign: props.messageAlign,
  });
  return (
    <ArkField.Root
      {...domProps(props)}
      ref={ref}
      className={classes.root}
      invalid={Boolean(props.error)}
      required={props.required}
      disabled={props.disabled}
      readOnly={props.readOnly}
    >
      <ArkField.Label className={classes.label}>
        {props.label}
        {props.required && "（必須）"}
      </ArkField.Label>
      <div className={classes.control}>{props.children}</div>
      {props.description !== undefined && !(props.messageLayout === "status" && props.error) && (
        <ArkField.HelperText className={classes.description}>
          {props.description}
        </ArkField.HelperText>
      )}
      {props.error && (
        <ArkField.ErrorText className={classes.error}>{props.error}</ArkField.ErrorText>
      )}
    </ArkField.Root>
  );
}
