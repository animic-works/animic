import { RadioGroup } from "@ark-ui/react/radio-group";
import { segmentedControl } from "@animic/styled-system/recipes";
import type { SegmentedControlVariantProps } from "@animic/styled-system/recipes";

export type SegmentedOption = { value: string; label: string };

export type SegmentedControlProps = SegmentedControlVariantProps & {
  /** 読み上げ用の名前（例: 難易度） */
  label: string;
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
};

// 並べた選択肢から1つ選ぶ。キーボード操作と読み上げはArk UIのRadioGroupが行う
export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  disabled,
  name,
  tone,
  variant,
}: SegmentedControlProps) {
  const classes = segmentedControl({ tone, variant });
  return (
    <RadioGroup.Root
      className={classes.root}
      value={value}
      onValueChange={(details) => {
        if (details.value !== null) onValueChange(details.value);
      }}
      disabled={disabled}
      name={name}
      orientation="horizontal"
      aria-label={label}
    >
      {options.map((option) => (
        <RadioGroup.Item key={option.value} value={option.value} className={classes.item}>
          <RadioGroup.ItemText className={classes.itemText}>{option.label}</RadioGroup.ItemText>
          <RadioGroup.ItemHiddenInput />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
