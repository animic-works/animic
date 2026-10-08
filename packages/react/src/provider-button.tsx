import { buttonState, blockButtonEvent } from "./button-state";
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
  const state = buttonState(props);
  return (
    <button
      {...domProps(props)}
      ref={ref}
      type="button"
      className={providerButton({ provider: props.provider })}
      {...state.attributes}
      onClick={(event) => {
        if (!blockButtonEvent(event, state.blocked)) props.onClick?.(event);
      }}
    >
      {props.loading ? <span aria-hidden="true" className={spinner()} /> : props.icon}
      <span>{props.children}</span>
    </button>
  );
}
