import { ark } from "@ark-ui/react/factory";
import { button, spinner } from "@animic/styled-system/recipes";
import type { ButtonVariantProps } from "@animic/styled-system/recipes";
import type { ComponentProps, ReactNode } from "react";

// 見た目はデザインシステムのbuttonレシピで決まる。classNameとstyleは受け取らない（画面側で見た目を作らない）
export type ButtonProps = Omit<ComponentProps<typeof ark.button>, "className" | "style"> &
  ButtonVariantProps & {
    /** 処理中。押せなくし、回転する輪を出す */
    loading?: boolean;
    /** 処理中に出す文言（例: 作っています…）。なければ元の文言のまま */
    loadingText?: string;
    /** 文言の前に置くアイコン */
    leadingIcon?: ReactNode;
    /** 文言の後ろに置くアイコン */
    trailingIcon?: ReactNode;
    /** 押した直後に一瞬つぶす（画面遷移の演出の開始時） */
    pressed?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  spread,
  labelAlign,
  loading = false,
  loadingText,
  leadingIcon,
  trailingIcon,
  pressed = false,
  disabled,
  children,
  type = "button",
  asChild,
  ...rest
}: ButtonProps) {
  return (
    <ark.button
      {...rest}
      asChild={asChild}
      // リンクなどに差し替えるとき（asChild）は、type を子に渡さない
      type={asChild ? undefined : type}
      className={button({ variant, size, fullWidth, spread, labelAlign })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-pressed={pressed || undefined}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <span className={spinner()} aria-hidden="true" />
          ) : leadingIcon ? (
            <span data-part="icon" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <span data-part="label">{loading && loadingText ? loadingText : children}</span>
          {trailingIcon ? (
            <span data-part="icon" aria-hidden="true">
              {trailingIcon}
            </span>
          ) : null}
        </>
      )}
    </ark.button>
  );
}
