import { Switch as ArkSwitch } from "@ark-ui/react/switch";
import { switchRecipe } from "@animic/styled-system/recipes";
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const c = switchRecipe();
  return (
    <ArkSwitch.Root
      checked={checked}
      onCheckedChange={(details) => onCheckedChange(details.checked)}
      disabled={disabled}
      className={c.root}
    >
      <ArkSwitch.Control className={c.control}>
        <ArkSwitch.Thumb className={c.thumb} />
      </ArkSwitch.Control>
      <ArkSwitch.Label className={c.label}>{label}</ArkSwitch.Label>
      <ArkSwitch.HiddenInput />
    </ArkSwitch.Root>
  );
}
