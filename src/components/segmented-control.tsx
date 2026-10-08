import { RadioGroup } from "@ark-ui/react/radio-group";

import { variant } from "./cx";
import { Icon } from "./icon";
import type { IconName } from "./icon";
import segmentedStyles from "./segmented-control.module.css";

type SegmentedOption = {
  value: string;
  label: string;
  /** 文言の前に置くアイコン */
  icon?: IconName;
  /** ポインターを乗せたときの補足 */
  title?: string;
};

export type SegmentedControlProps = {
  /** 読み上げ用の名前（例: 難易度） */
  label: string;
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  tone?: "neutral" | "accent";
  /** mode は選んだ側へ色の札が滑る小さな切り替え（文章／タグ） */
  variant?: "fill" | "lift" | "mode";
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
      // 滑る札の色を選んだ値で変える（Indicatorには選んだ値が付かないため）
      data-mode={controlVariant === "mode" ? value : undefined}
    >
      {controlVariant === "mode" ? (
        <RadioGroup.Indicator className={segmentedStyles.indicator} />
      ) : null}
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className={variant(segmentedStyles, "item", { tone, variant: controlVariant })}
          title={option.title}
        >
          {option.icon ? <Icon name={option.icon} size="xs" /> : null}
          <RadioGroup.ItemText className={segmentedStyles.itemText}>
            {option.label}
          </RadioGroup.ItemText>
          <RadioGroup.ItemHiddenInput />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
