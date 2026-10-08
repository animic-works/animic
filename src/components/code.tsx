import { Field } from "@ark-ui/react/field";
import { PinInput } from "@ark-ui/react/pin-input";
import { useState } from "react";

import { variant } from "./cx";
import codeInputStyles from "./code-input.module.css";
import codeDisplayStyles from "./code-display.module.css";

export type CodeInputProps = {
  value: string;
  onValueChange: (code: string) => void;
  /** マスの数（コードの長さ） */
  length: number;
  /** コードに使う文字（大文字）。小文字は大文字に直し、ほかの文字は受け付けない */
  characters: string;
  /** 何も入れていないときの説明（例: 使う文字の決まり） */
  hint: string;
  autoFocus?: boolean;
};

// ルームコードを1マスに1文字ずつ入れる。貼り付け・読み上げ・小文字の入力に対応する。
// コードの決まり（長さ・文字）は画面から受け取る
export function CodeInput({
  value,
  onValueChange,
  length,
  characters,
  hint,
  autoFocus,
}: CodeInputProps) {
  const [invalid, setInvalid] = useState<string | null>(null);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");
  const filled = value.length;
  const complete = filled === length;
  const message = invalid
    ? `「${invalid}」はルームコードに使われていません`
    : complete
      ? "このコードで参加します"
      : filled
        ? `あと${length - filled}文字`
        : hint;

  // 小文字・ハイフン・空白を整え、使われていない文字は受け付けずに理由を出す
  function accept(raw: string) {
    const upper = raw.toUpperCase();
    const bad = Array.from(upper).find((char) => !characters.includes(char));
    setInvalid(bad ?? null);
    const next = Array.from(upper)
      .filter((char) => characters.includes(char))
      .join("")
      .slice(0, length);
    onValueChange(next);
  }

  return (
    <Field.Root className={codeInputStyles.root} invalid={Boolean(invalid)}>
      <PinInput.Root
        count={length}
        type="alphanumeric"
        placeholder="•"
        autoFocus={autoFocus}
        value={chars}
        translations={{
          inputLabel: (index, count) => `ルームコードの${index + 1}文字目（全${count}文字）`,
        }}
        onValueChange={(details) => accept(details.value.join(""))}
        onValueInvalid={(details) => setInvalid(details.value)}
      >
        <PinInput.Control className={codeInputStyles.control}>
          {chars.map((_, index) => (
            <PinInput.Input
              key={index}
              index={index}
              className={codeInputStyles.input}
              autoCapitalize="characters"
              spellCheck={false}
              data-filled={chars[index] ? "" : undefined}
            />
          ))}
        </PinInput.Control>
        <PinInput.HiddenInput />
      </PinInput.Root>
      {invalid ? (
        <Field.ErrorText className={codeInputStyles.message} data-error="">
          {message}
        </Field.ErrorText>
      ) : (
        <Field.HelperText className={codeInputStyles.message}>{message}</Field.HelperText>
      )}
    </Field.Root>
  );
}

export type CodeDisplayProps = {
  code: string;
  /** 読み上げ用の名前。省くと飾りとして扱う（近くに文字でコードを出す場合） */
  label?: string;
  size?: "md" | "sm";
};

// 決まったルームコードを1文字ずつマスで見せる
export function CodeDisplay({ code, label, size = "md" }: CodeDisplayProps) {
  return (
    <div
      className={variant(codeDisplayStyles, "root", { size })}
      role={label ? "group" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {Array.from(code, (char, index) => (
        <span
          key={index}
          className={variant(codeDisplayStyles, "cell", { size })}
          style={{ "--char-index": index }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
