import { Field } from "@ark-ui/react/field";
import { field } from "@animic/styled-system/recipes";
import type { ComponentProps, ReactNode } from "react";

export type TextFieldProps = Omit<ComponentProps<"input">, "className" | "style" | "size"> & {
  /** 項目名。必ず付ける（見た目で省きたい場合も読み上げ用に必要） */
  label: string;
  /** 入力の補足（文字数の上限など） */
  helperText?: ReactNode;
  /** エラーの文言。あるときは入力欄を赤くし、読み上げにも伝える */
  errorText?: ReactNode;
  invalid?: boolean;
};

// 1行の文字入力。項目名・補足・エラーとの関連づけ（aria）はArk UIのFieldが行う
export function TextField({
  label,
  helperText,
  errorText,
  invalid,
  required,
  disabled,
  readOnly,
  ...inputProps
}: TextFieldProps) {
  const classes = field();
  return (
    <Field.Root
      className={classes.root}
      invalid={invalid || Boolean(errorText)}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    >
      <Field.Label className={classes.label}>{label}</Field.Label>
      <Field.Input {...inputProps} className={classes.input} />
      {helperText ? (
        <Field.HelperText className={classes.helperText}>{helperText}</Field.HelperText>
      ) : null}
      {errorText ? (
        <Field.ErrorText className={classes.errorText}>{errorText}</Field.ErrorText>
      ) : null}
    </Field.Root>
  );
}
