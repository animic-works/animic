import { ark } from "@ark-ui/react/factory";
import type { ComponentProps, ReactNode } from "react";

import { configVariant, cx } from "./cx";
import buttonStyles from "./button.module.css";
import spinnerStyles from "./spinner.module.css";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "inverse"
  | "destructive"
  | "link"
  | "discord";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "provider" | "hero";

// 見た目はデザインシステムのbuttonレシピで決まる。classNameとstyleは受け取らない（画面側で見た目を作らない）
export type ButtonProps = Omit<ComponentProps<typeof ark.button>, "className" | "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  spread?: boolean;
  labelAlign?: "start" | "center";
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
  variant = "primary",
  size = "lg",
  fullWidth = false,
  spread = false,
  labelAlign = "center",
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
  const className = cx(
    configVariant(buttonStyles, { variant, size, fullWidth, spread, labelAlign }),
    variant === "primary" && size === "hero" && buttonStyles.compound__size_hero__variant_primary,
    variant === "secondary" &&
      size === "provider" &&
      buttonStyles.compound__size_provider__variant_secondary,
    variant === "secondary" &&
      size === "hero" &&
      buttonStyles.compound__size_hero__variant_secondary,
    variant === "primary" && size === "sm" && buttonStyles.compound__size_sm__variant_primary,
  );
  return (
    <ark.button
      {...rest}
      asChild={asChild}
      // リンクなどに差し替えるとき（asChild）は、type を子に渡さない
      type={asChild ? undefined : type}
      className={className}
      // ロビーの開始ボタンなど、画面側のレシピが主ボタンを狙うための目印
      data-variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-pressed={pressed || undefined}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <span className={configVariant(spinnerStyles, { size: "sm" })} aria-hidden="true" />
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
