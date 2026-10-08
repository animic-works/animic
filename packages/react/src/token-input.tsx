import { useScrollViewport } from "./use-scroll-viewport";
import {
  useState,
  useRef,
  type CompositionEventHandler,
  type KeyboardEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import { Combobox, createListCollection, useCombobox } from "@ark-ui/react/combobox";
import { tokenInput } from "@animic/styled-system/recipes";
export interface TokenInputProps {
  children: ReactNode;
  label: string;
  value: string;
  onValueChange: (value: string, composing: boolean) => void;
  onCommit: () => void;
  onEmptyBackspace?: () => void;
  onCompositionEnd?: CompositionEventHandler<HTMLInputElement>;
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  footer?: ReactNode;
  suggestions: readonly { value: string; label: string; description: string }[];
  onSuggestion: (value: string) => void;
}
export function TokenInput({ inputRef, ...props }: TokenInputProps) {
  const c = tokenInput();
  const { ref: contentScrollRef, scrollbars: contentScrollBars } =
    useScrollViewport<HTMLDivElement>(props.label);
  const { ref: suggestionsScrollRef, scrollbars: suggestionsScrollBars } =
    useScrollViewport<HTMLDivElement>("入力候補");
  const composing = useRef(false);
  const [open, setOpen] = useState(false);
  const combobox = useCombobox({
    collection: createListCollection({ items: props.suggestions }),
    inputValue: props.value,
    value: [],
    disabled: props.disabled,
    inputBehavior: "autohighlight",
    selectionBehavior: "preserve",
    loopFocus: true,
    open: open && !props.disabled && props.suggestions.length > 0,
    onOpenChange: ({ open: nextOpen }) => setOpen(nextOpen),
    onInputValueChange: ({ inputValue }) => props.onValueChange(inputValue, composing.current),
    onSelect: ({ value }) => {
      if (value[0]) props.onSuggestion(value[0]);
    },
  });
  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Tab" && !event.shiftKey && combobox.open && combobox.highlightedValue) {
      event.preventDefault();
      combobox.selectValue(combobox.highlightedValue);
    } else if (event.key === "Enter" && !(combobox.open && combobox.highlightedValue)) {
      event.preventDefault();
      props.onCommit();
      combobox.setOpen(false);
    } else if (event.key === "Backspace" && !props.value) {
      props.onEmptyBackspace?.();
    }
  };
  return (
    <Combobox.RootProvider value={combobox} className={c.root}>
      <div className={c.content} ref={contentScrollRef} data-animic-scroll-viewport="">
        {props.children}
        <Combobox.Input
          ref={inputRef}
          className={c.input}
          aria-label={props.label}
          placeholder={props.placeholder}
          onKeyDownCapture={onKeyDown}
          onFocus={() => combobox.setOpen(true)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            props.onValueChange(event.currentTarget.value, false);
            props.onCompositionEnd?.(event);
          }}
        />
      </div>
      {contentScrollBars}
      {suggestionsScrollBars}
      {props.footer && <div className={c.footer}>{props.footer}</div>}
      <Combobox.Content
        ref={suggestionsScrollRef}
        data-animic-scroll-viewport=""
        aria-label="入力候補"
        className={c.suggestions}
      >
        {props.suggestions.map((option) => (
          <Combobox.Item item={option} key={option.value} className={c.option}>
            <Combobox.ItemText>{option.label}</Combobox.ItemText>
            <span>{option.description}</span>
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox.RootProvider>
  );
}

export function AdjustableToken({
  label,
  value,
  emphasis,
  onEdit,
  onIncrease,
  onDecrease,
  disabled,
  increaseDisabled,
  decreaseDisabled,
}: {
  label: string;
  value?: string;
  emphasis?: "normal" | "strong" | "weak";
  onEdit: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  increaseDisabled?: boolean;
  decreaseDisabled?: boolean;
}) {
  const c = tokenInput({ emphasis });
  return (
    <span className={c.token}>
      <button
        type="button"
        className={c.label}
        disabled={disabled}
        onClick={onEdit}
        aria-label={`「${label}」を書き直す`}
      >
        {label}
      </button>
      {value && <span>{value}</span>}
      <span className={c.actions}>
        <button
          type="button"
          className={c.adjustment}
          disabled={disabled || increaseDisabled}
          onClick={onIncrease}
          aria-label={`「${label}」を強くする`}
        >
          +
        </button>
        <button
          type="button"
          className={c.adjustment}
          disabled={disabled || decreaseDisabled}
          onClick={onDecrease}
          aria-label={`「${label}」を弱くする`}
        >
          −
        </button>
      </span>
    </span>
  );
}
