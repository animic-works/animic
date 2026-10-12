import { useRef, useState, type ChangeEventHandler, type FocusEventHandler } from "react";
import { Field as ArkField, useFieldContext } from "@ark-ui/react/field";
import { codeInput } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface CodeInputProps extends Omit<CommonProps<HTMLInputElement>, "children"> {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  length: number;
  invalidIndices?: readonly number[];
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  inputMode?: "text" | "numeric";
  autoComplete?: string;
  size?: "standard" | "compact";
  editing?: "selection" | "append";
}

export function CodeInput({ ref, ...props }: CodeInputProps) {
  const field = useFieldContext();
  const fieldProps = field?.getInputProps();
  const [selection, setSelection] = useState({ start: 0, end: 0, focused: false });
  const cells = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ anchor: number; x: number; y: number; type: string } | null>(null);
  const length = Number.isFinite(props.length) ? Math.max(1, Math.trunc(props.length)) : 1;
  const classes = codeInput({ size: props.size });
  const append = props.editing === "append";
  const updateSelection = (input: HTMLInputElement) =>
    setSelection({ start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0, focused: true });
  function positionAt(clientX: number) {
    const elements = Array.from(cells.current?.children ?? []);
    const rtl = cells.current && getComputedStyle(cells.current).direction === "rtl";
    const index = elements.findIndex((cell) => {
      const box = cell.getBoundingClientRect();
      return rtl ? clientX >= box.x + box.width / 2 : clientX <= box.x + box.width / 2;
    });
    return Math.min(index < 0 ? length : index, props.value.length);
  }
  function select(input: HTMLInputElement, anchor: number, end: number) {
    input.setSelectionRange(
      Math.min(anchor, end),
      Math.max(anchor, end),
      end < anchor ? "backward" : "forward",
    );
    updateSelection(input);
  }
  function toEnd(input: HTMLInputElement) {
    select(input, input.value.length, input.value.length);
  }
  const invalid = fieldProps?.["aria-invalid"] ?? props["aria-invalid"];
  return (
    <div
      className={classes.root}
      data-invalid={invalid === true || invalid === "true" ? "" : undefined}
      data-complete={props.value.length === length && !invalid ? "" : undefined}
      data-invalid-all={
        (invalid === true || invalid === "true") && props.invalidIndices === undefined
          ? ""
          : undefined
      }
      data-disabled={props.disabled || field?.disabled ? "" : undefined}
    >
      <ArkField.Input
        {...domProps(props)}
        ref={ref}
        className={classes.input}
        id={fieldProps?.id ?? props.id}
        aria-labelledby={field?.ids.label ?? props["aria-labelledby"]}
        aria-describedby={field ? fieldProps?.["aria-describedby"] : props["aria-describedby"]}
        aria-errormessage={field ? fieldProps?.["aria-errormessage"] : props["aria-errormessage"]}
        aria-invalid={invalid}
        type="text"
        name={props.name}
        value={props.value}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        inputMode={props.inputMode ?? "text"}
        autoComplete={props.autoComplete ?? "off"}
        autoCapitalize="characters"
        spellCheck={false}
        onPointerDown={(event) => {
          if (append) return;
          if (event.button !== 0) return;
          const input = event.currentTarget;
          const position = positionAt(event.clientX);
          const anchor = event.shiftKey ? (input.selectionStart ?? position) : position;
          pointer.current = { anchor, x: event.clientX, y: event.clientY, type: event.pointerType };
          if (event.pointerType === "mouse") {
            event.preventDefault();
            input.focus();
            input.setPointerCapture(event.pointerId);
            select(input, anchor, position);
          }
        }}
        onPointerMove={(event) => {
          if (pointer.current?.type === "mouse")
            select(event.currentTarget, pointer.current.anchor, positionAt(event.clientX));
        }}
        onPointerUp={(event) => {
          const start = pointer.current;
          pointer.current = null;
          if (!start) return;
          if (start.type === "mouse") {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } else if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) {
            event.currentTarget.focus();
            const position = positionAt(event.clientX);
            select(event.currentTarget, position, position);
          }
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onDoubleClick={(event) => {
          if (append) return;
          event.currentTarget.select();
          updateSelection(event.currentTarget);
        }}
        onChange={(event) => {
          props.onChange(event);
          if (append) toEnd(event.currentTarget);
          else updateSelection(event.currentTarget);
        }}
        onClick={(event) => {
          if (append) toEnd(event.currentTarget);
        }}
        onKeyDown={(event) => {
          if (
            append &&
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)
          )
            event.preventDefault();
        }}
        onSelect={(event) => updateSelection(event.currentTarget)}
        onFocus={(event) => {
          if (append) toEnd(event.currentTarget);
          else updateSelection(event.currentTarget);
        }}
        onBlur={(event) => {
          setSelection((previous) => ({ ...previous, focused: false }));
          props.onBlur?.(event);
        }}
      />
      <div ref={cells} className={classes.cells} aria-hidden="true">
        {Array.from({ length }, (_, index) => (
          <span
            key={index}
            className={classes.cell}
            data-invalid={props.invalidIndices?.includes(index) ? "" : undefined}
            data-filled={props.value[index] ? "" : undefined}
            data-active={
              selection.focused &&
              (append || selection.start === selection.end) &&
              index === Math.min(append ? props.value.length : selection.start, length - 1)
                ? ""
                : undefined
            }
            data-selected={
              !append && selection.focused && index >= selection.start && index < selection.end
                ? ""
                : undefined
            }
          >
            {props.value[index] ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}
