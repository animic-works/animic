import { Switch as ArkSwitch } from "@ark-ui/react/switch";

import { variant } from "./cx";
import switchStyles from "./switch.module.css";

export type SwitchProps = {
  /** スイッチの右に出す文言。読み上げの名前にもなる */
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  /** accent はオンのときに文言もピンクにする */
  tone?: "neutral" | "accent";
  /** ポインターを乗せたときの補足 */
  title?: string;
};

// オン・オフを切り替えるスイッチ。キーボード操作と読み上げはArk UIのSwitchが行う
export function Switch({
  label,
  checked,
  onCheckedChange,
  disabled,
  name,
  tone = "neutral",
  title,
}: SwitchProps) {
  return (
    <ArkSwitch.Root
      className={variant(switchStyles, "root", { tone })}
      checked={checked}
      onCheckedChange={(details) => onCheckedChange(details.checked)}
      disabled={disabled}
      name={name}
      title={title}
    >
      <ArkSwitch.Control className={switchStyles.control}>
        <ArkSwitch.Thumb className={switchStyles.thumb} />
      </ArkSwitch.Control>
      <ArkSwitch.Label className={switchStyles.label}>{label}</ArkSwitch.Label>
      <ArkSwitch.HiddenInput role="switch" />
    </ArkSwitch.Root>
  );
}
