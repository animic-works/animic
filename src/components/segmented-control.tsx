import { RadioGroup } from "@ark-ui/react/radio-group";

import { variant } from "./cx";
import segmentedStyles from "./segmented-control.module.css";

export type SegmentedOption = { value: string; label: string };

export type SegmentedControlProps = {
  /** 読み上げ用の名前（例: 難易度） */
  label: string;
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  tone?: "neutral" | "accent";
  variant?: "fill" | "lift";
};

// 並べた選択肢から1つ選ぶ。キーボード操作と読み上げはArk UIのRadioGroupが行う
export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  disabled,
  name,
  tone = "neutral",
  variant: controlVariant = "fill",
}: SegmentedControlProps) {
  return (
    <RadioGroup.Root
      className={variant(segmentedStyles, "root", { tone, variant: controlVariant })}
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
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className={variant(segmentedStyles, "item", { tone, variant: controlVariant })}
        >
          <RadioGroup.ItemText className={segmentedStyles.itemText}>
            {option.label}
          </RadioGroup.ItemText>
          <RadioGroup.ItemHiddenInput />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
