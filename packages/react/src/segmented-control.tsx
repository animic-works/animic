import { useSyncExternalStore } from "react";
import { SegmentGroup } from "@ark-ui/react/segment-group";
import { segmentedControl } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface SegmentedControlProps extends Omit<CommonProps, "children"> {
  label: string;
  labelVisibility?: "visible" | "hidden";
  labelPlacement?: "stacked" | "inline";
  density?: "comfortable" | "compact";
  appearance?: "outlined" | "pill" | "chips" | "list";
  enclosure?: "subtle" | "outlined";
  tone?: "neutral" | "accent" | "violet" | "green" | "yellow" | "cyan";
  options: readonly {
    value: string;
    label: string;
    disabled?: boolean;
    tone?: "green" | "yellow" | "cyan";
  }[];
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}
const compactList = "(max-width: 53.75em), (max-aspect-ratio: 1/1)";
function subscribeLayout(listener: () => void) {
  const query = matchMedia(compactList);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
export function SegmentedControl({ ref, ...props }: SegmentedControlProps) {
  const narrow = useSyncExternalStore(
    subscribeLayout,
    () => matchMedia(compactList).matches,
    () => false,
  );
  const classes = segmentedControl({
    appearance: props.appearance,
    tone: props.tone,
    density: props.density,
    enclosure: props.enclosure,
    labelVisibility: props.labelVisibility,
    labelPlacement: props.labelPlacement,
  });
  return (
    <SegmentGroup.Root
      {...domProps(props)}
      orientation={props.appearance === "list" && !narrow ? "vertical" : "horizontal"}
      ref={ref}
      className={classes.root}
      value={props.value}
      defaultValue={props.defaultValue}
      name={props.name}
      disabled={props.disabled}
      onValueChange={(details) => {
        if (details.value !== null) props.onValueChange?.(details.value);
      }}
    >
      <div className={classes.layout}>
        <SegmentGroup.Label className={classes.groupLabel}>{props.label}</SegmentGroup.Label>
        <div className={classes.group}>
          {props.options.map((option) => (
            <SegmentGroup.Item
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={
                segmentedControl({
                  appearance: props.appearance,
                  tone: option.tone ?? props.tone,
                  density: props.density,
                }).item
              }
            >
              <SegmentGroup.ItemControl className={classes.control} />
              <SegmentGroup.ItemText className={classes.label}>
                {option.label}
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </div>
      </div>
    </SegmentGroup.Root>
  );
}
