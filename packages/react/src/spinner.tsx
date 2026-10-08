import { spinner } from "@animic/styled-system/recipes";
import { Text } from "./text";
export interface SpinnerProps {
  label: string;
  labelVisibility?: "visible" | "hidden";
  size?: "sm" | "lg";
  tone?: "neutral" | "gradient";
}
export function Spinner({ label, labelVisibility = "visible", size, tone }: SpinnerProps) {
  return (
    <span role="status" aria-label={labelVisibility === "hidden" ? label : undefined}>
      <span aria-hidden="true" className={spinner({ size, tone })} />{" "}
      {labelVisibility === "visible" && <Text>{label}</Text>}
    </span>
  );
}
