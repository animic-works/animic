import { SegmentGroup } from "@ark-ui/react/segment-group";
import { segmentedControl } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface SegmentedControlProps extends Omit<CommonProps, "children"> {
  label: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}
export function SegmentedControl({ ref, ...props }: SegmentedControlProps) {
  const classes = segmentedControl();
  return (
    <SegmentGroup.Root
      {...domProps(props)}
      ref={ref}
      className={classes.root}
      aria-label={props.label}
      value={props.value}
      defaultValue={props.defaultValue}
      name={props.name}
      disabled={props.disabled}
      onValueChange={(details) => {
        if (details.value !== null) props.onValueChange?.(details.value);
      }}
    >
      {props.options.map((option) => (
        <SegmentGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={classes.item}
        >
          <SegmentGroup.ItemControl className={classes.control} />
          <SegmentGroup.ItemText className={classes.label}>{option.label}</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}
