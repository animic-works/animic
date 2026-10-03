import { Portal } from "@ark-ui/react/portal";
import { Select as ArkSelect, createListCollection } from "@ark-ui/react/select";
import { select } from "@animic/styled-system/recipes";
import { useMemo } from "react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = {
  label: string;
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** フォームで送るときの名前 */
  name?: string;
};

// 選択肢から1つ選ぶ。キーボード操作・読み上げ・一覧の位置合わせはArk UIのSelectが行う
export function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder = "選んでください",
  disabled,
  name,
}: SelectProps) {
  const collection = useMemo(
    () =>
      createListCollection({ items: options, isItemDisabled: (item) => Boolean(item.disabled) }),
    [options],
  );
  const classes = select();
  return (
    <ArkSelect.Root
      className={classes.root}
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(details) => {
        const next = details.value[0];
        if (next !== undefined) onValueChange(next);
      }}
      disabled={disabled}
      name={name}
      positioning={{ sameWidth: true }}
    >
      <ArkSelect.Label className={classes.label}>{label}</ArkSelect.Label>
      <ArkSelect.Control className={classes.control}>
        <ArkSelect.Trigger className={classes.trigger}>
          <ArkSelect.ValueText className={classes.valueText} placeholder={placeholder} />
          <ArkSelect.Indicator className={classes.indicator}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal>
        <ArkSelect.Positioner className={classes.positioner}>
          <ArkSelect.Content className={classes.content}>
            {collection.items.map((item) => (
              <ArkSelect.Item key={item.value} item={item} className={classes.item}>
                <ArkSelect.ItemText className={classes.itemText}>{item.label}</ArkSelect.ItemText>
                <ArkSelect.ItemIndicator className={classes.itemIndicator}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </ArkSelect.ItemIndicator>
              </ArkSelect.Item>
            ))}
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
      <ArkSelect.HiddenSelect />
    </ArkSelect.Root>
  );
}
