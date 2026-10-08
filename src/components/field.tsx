import { Field } from "@ark-ui/react/field";
import type { ComponentProps, ReactNode } from "react";

import fieldStyles from "./field.module.css";

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
  return (
    <Field.Root
      className={fieldStyles.root}
      invalid={invalid || Boolean(errorText)}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    >
      <Field.Label className={fieldStyles.label}>{label}</Field.Label>
      <Field.Input {...inputProps} className={fieldStyles.input} />
      {helperText ? (
        <Field.HelperText className={fieldStyles.helperText}>{helperText}</Field.HelperText>
      ) : null}
      {errorText ? (
        <Field.ErrorText className={fieldStyles.errorText}>{errorText}</Field.ErrorText>
      ) : null}
    </Field.Root>
  );
}

export type TextAreaProps = Omit<ComponentProps<"textarea">, "className" | "style"> & {
  /** 項目名。必ず付ける */
  label: string;
  /** 入力の補足（文字数の上限など） */
  helperText?: ReactNode;
  /** エラーの文言。あるときは入力欄を赤くし、読み上げにも伝える */
  errorText?: ReactNode;
  invalid?: boolean;
};

// 複数行の文字入力（プロンプト・備考）。項目名・補足・エラーとの関連づけ（aria）はArk UIのFieldが行う
export function TextArea({
  label,
  helperText,
  errorText,
  invalid,
  required,
  disabled,
  readOnly,
  ...textareaProps
}: TextAreaProps) {
  return (
    <Field.Root
      className={fieldStyles.root}
      invalid={invalid || Boolean(errorText)}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    >
      <Field.Label className={fieldStyles.label}>{label}</Field.Label>
      <Field.Textarea {...textareaProps} className={fieldStyles.textarea} />
      {helperText ? (
        <Field.HelperText className={fieldStyles.helperText}>{helperText}</Field.HelperText>
      ) : null}
      {errorText ? (
        <Field.ErrorText className={fieldStyles.errorText}>{errorText}</Field.ErrorText>
      ) : null}
    </Field.Root>
  );
}
