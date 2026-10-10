import { useScrollViewport } from "./use-scroll-viewport";
import {
  useState,
  useEffect,
  useRef,
  type CompositionEventHandler,
  type ComponentPropsWithRef,
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
  commitOnBlur?: boolean;
  /** 入力欄が空のときのBackspace。押し続けたときの繰り返し（`repeat`）では呼ばない */
  onEmptyBackspace?: () => void;
  onSubmitShortcut?: () => void;
  font?: "body" | "code";
  onCompositionEnd?: CompositionEventHandler<HTMLInputElement>;
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  footer?: ReactNode;
  empty?: ReactNode;
  suggestions: readonly {
    value: string;
    label: string;
    labelContent?: ReactNode;
    description: ReactNode;
    detail?: ReactNode;
  }[];
  onSuggestion: (value: string) => void;
}
// ArkのDOM用defaultValueを外し、利用側で正規化した値をReactのcontrolled inputへ反映する。
function ControlledComboboxInput(props: ComponentPropsWithRef<"input">) {
  return <input {...props} defaultValue={undefined} />;
}

export function TokenInput({ inputRef, ...props }: TokenInputProps) {
  const c = tokenInput({ font: props.font });
  const { ref: contentScrollRef, scrollbars: contentScrollBars } =
    useScrollViewport<HTMLDivElement>(props.label);
  const { ref: suggestionsScrollRef, scrollbars: suggestionsScrollBars } =
    useScrollViewport<HTMLDivElement>("入力候補");
  const composing = useRef(false);
  const queuedSelection = useRef<string | null>(null);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(selectionTimer.current), []);
  useEffect(() => {
    if (props.disabled) {
      clearTimeout(selectionTimer.current);
      queuedSelection.current = null;
    }
  }, [props.disabled]);
  const [open, setOpen] = useState(false);
  const combobox = useCombobox({
    collection: createListCollection({ items: props.suggestions }),
    inputValue: props.value,
    value: [],
    disabled: props.disabled,
    inputBehavior: "autohighlight",
    selectionBehavior: "preserve",
    loopFocus: true,
    open:
      open &&
      !props.disabled &&
      (props.suggestions.length > 0 || Boolean(props.value.trim() && props.empty)),
    onOpenChange: ({ open: nextOpen }) => setOpen(nextOpen),
    onInputValueChange: ({ inputValue }) => props.onValueChange(inputValue, composing.current),
    onSelect: ({ value }) => {
      if (value[0]) props.onSuggestion(value[0]);
    },
  });
  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    const isComposing = composing.current || event.nativeEvent.isComposing || event.keyCode === 229;
    if (event.key === "Tab" && !event.shiftKey && combobox.open && combobox.highlightedValue) {
      event.preventDefault();
      event.stopPropagation();
      if (isComposing) {
        queuedSelection.current = combobox.highlightedValue;
        event.currentTarget.blur();
        event.currentTarget.focus();
      } else {
        combobox.selectValue(combobox.highlightedValue);
      }
      return;
    }
    if (isComposing) return;
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && props.onSubmitShortcut) {
      event.preventDefault();
      event.stopPropagation();
      props.onSubmitShortcut();
    } else if (event.key === "Enter" && !(combobox.open && combobox.highlightedValue)) {
      event.preventDefault();
      event.stopPropagation();
      props.onCommit();
      combobox.setOpen(false);
    } else if (event.key === "Backspace" && !props.value && props.onEmptyBackspace) {
      event.preventDefault();
      // 押し続けたときの繰り返しでは呼ばない。書き直しに戻した語句を消し終えても、前の語句まで消し続けないようにする
      if (!event.repeat) props.onEmptyBackspace();
    }
  };
  return (
    <Combobox.RootProvider value={combobox} className={c.root}>
      <div
        className={c.content}
        ref={contentScrollRef}
        data-animic-scroll-viewport=""
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget || props.disabled) return;
          event.preventDefault();
          event.currentTarget.querySelector("input")?.focus();
        }}
      >
        {props.children}
        <Combobox.Input
          ref={inputRef}
          asChild
          className={c.input}
          aria-label={props.label}
          placeholder={props.placeholder}
          onKeyDownCapture={onKeyDown}
          onFocus={() => combobox.setOpen(true)}
          onBlur={() => {
            if (
              !props.disabled &&
              props.commitOnBlur &&
              queuedSelection.current === null &&
              !composing.current
            )
              props.onCommit();
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            const selection = queuedSelection.current;
            if (selection === null) {
              props.onValueChange(event.currentTarget.value, false);
            } else {
              selectionTimer.current = setTimeout(() => {
                queuedSelection.current = null;
                if (!props.disabled) props.onSuggestion(selection);
              });
            }
            props.onCompositionEnd?.(event);
          }}
        >
          <ControlledComboboxInput value={props.value} />
        </Combobox.Input>
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
        {props.suggestions.length === 0 && props.empty && (
          <Combobox.Empty className={c.empty}>{props.empty}</Combobox.Empty>
        )}
        {props.suggestions.map((option) => (
          <Combobox.Item item={option} key={option.value} className={c.option}>
            <Combobox.ItemText>{option.labelContent ?? option.label}</Combobox.ItemText>
            <span>{option.description}</span>
            {option.detail && <span>{option.detail}</span>}
            {combobox.highlightedValue === option.value && <kbd className={c.shortcut}>Tab</kbd>}
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox.RootProvider>
  );
}

export function AdjustableToken({
  label,
  value,
  valueLabel,
  font,
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
  valueLabel?: string;
  font?: "body" | "code";
  emphasis?: "normal" | "strong" | "weak";
  onEdit: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  increaseDisabled?: boolean;
  decreaseDisabled?: boolean;
}) {
  const c = tokenInput({ emphasis, font });
  return (
    <span className={c.token}>
      <button
        type="button"
        className={c.label}
        disabled={disabled}
        onClick={onEdit}
        aria-label={`「${label}」を書き直す${valueLabel || value ? `（${valueLabel ?? value}）` : ""}`}
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
