import type { MouseEventHandler, ReactNode } from "react";
import { providerButton, spinner } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface ProviderButtonProps extends CommonProps<HTMLButtonElement> {
  provider: "google" | "discord";
  icon: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function ProviderButton({ ref, ...props }: ProviderButtonProps) {
  return (
    <button
      {...domProps(props)}
      ref={ref}
      type="button"
      className={providerButton({ provider: props.provider })}
      disabled={props.disabled || props.loading}
      aria-busy={props.loading || undefined}
      onClick={props.onClick}
    >
      {props.loading ? <span aria-hidden="true" className={spinner()} /> : props.icon}
      <span>{props.children}</span>
    </button>
  );
}
