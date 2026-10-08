import type { AriaAttributes, MouseEvent } from "react";

interface ButtonStateProps extends AriaAttributes {
  disabled?: boolean;
  loading?: boolean;
}

/** 処理中は外観とフォーカスを保つ。業務条件による操作不可はnative disabledにする。 */
export function buttonState(props: ButtonStateProps) {
  const busy = props.loading || props["aria-busy"] === true || props["aria-busy"] === "true";
  const unavailable =
    props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return {
    blocked: unavailable || busy,
    attributes: {
      disabled: unavailable || undefined,
      "aria-disabled": unavailable || busy || undefined,
      "aria-busy": busy || undefined,
      "data-loading": busy && !unavailable ? "" : undefined,
    },
  };
}

/** clickはポインター操作・Enter・Space・submitの共通の起点。 */
export function blockButtonEvent(event: MouseEvent<HTMLButtonElement>, blocked: boolean) {
  if (!blocked) return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}
