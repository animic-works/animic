import { Field } from "@ark-ui/react/field";
import { PinInput } from "@ark-ui/react/pin-input";
import { codeDisplay, codeInput } from "@animic/styled-system/recipes";
import type { CodeDisplayVariantProps } from "@animic/styled-system/recipes";
import { useState } from "react";

export const CODE_LENGTH = 8;
// 0・O・1・I・L を除く大文字英数字。小文字は大文字に直す
const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_HINT = "英数字8文字（0・O・1・I・Lは使いません）";

export type CodeInputProps = {
  value: string;
  onValueChange: (code: string) => void;
  /** 8文字そろったとき（Enterや貼り付けの直後） */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
};

// ルームコードを8マスに1文字ずつ入れる。貼り付け・読み上げ・小文字の入力に対応する
export function CodeInput({
  value,
  onValueChange,
  onComplete,
  autoFocus,
  disabled,
}: CodeInputProps) {
  const classes = codeInput();
  const [invalid, setInvalid] = useState<string | null>(null);
  const chars = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");
  const filled = value.length;
  const complete = filled === CODE_LENGTH;
  const message = invalid
    ? `「${invalid}」はルームコードに使われていません`
    : complete
      ? "このコードで参加します"
      : filled
        ? `あと${CODE_LENGTH - filled}文字`
        : CODE_HINT;

  // 小文字・ハイフン・空白を整え、使われていない文字は受け付けずに理由を出す
  function accept(raw: string) {
    const upper = raw.toUpperCase();
    const bad = Array.from(upper).find((char) => !CODE_CHARS.includes(char));
    setInvalid(bad ?? null);
    const next = Array.from(upper)
      .filter((char) => CODE_CHARS.includes(char))
      .join("")
      .slice(0, CODE_LENGTH);
    onValueChange(next);
    if (next.length === CODE_LENGTH && !bad) onComplete?.(next);
  }

  return (
    <Field.Root className={classes.root} invalid={Boolean(invalid)} disabled={disabled}>
      <PinInput.Root
        count={CODE_LENGTH}
        type="alphanumeric"
        placeholder="•"
        autoFocus={autoFocus}
        disabled={disabled}
        value={chars}
        translations={{
          inputLabel: (index, count) => `ルームコードの${index + 1}文字目（全${count}文字）`,
        }}
        onValueChange={(details) => accept(details.value.join(""))}
        onValueInvalid={(details) => setInvalid(details.value)}
      >
        <PinInput.Control className={classes.control}>
          {chars.map((_, index) => (
            <PinInput.Input
              key={index}
              index={index}
              className={classes.input}
              autoCapitalize="characters"
              spellCheck={false}
              data-filled={chars[index] ? "" : undefined}
            />
          ))}
        </PinInput.Control>
        <PinInput.HiddenInput />
      </PinInput.Root>
      {invalid ? (
        <Field.ErrorText className={classes.message} data-error="">
          {message}
        </Field.ErrorText>
      ) : (
        <Field.HelperText className={classes.message}>{message}</Field.HelperText>
      )}
    </Field.Root>
  );
}

export type CodeDisplayProps = CodeDisplayVariantProps & {
  code: string;
  /** 読み上げ用の名前。省くと飾りとして扱う（近くに文字でコードを出す場合） */
  label?: string;
};

// 決まったルームコードを1文字ずつマスで見せる
export function CodeDisplay({ code, label, size }: CodeDisplayProps) {
  const classes = codeDisplay({ size });
  return (
    <div
      className={classes.root}
      role={label ? "group" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {Array.from(code, (char, index) => (
        <span key={index} className={classes.cell} style={{ "--char-index": index }}>
          {char}
        </span>
      ))}
    </div>
  );
}
