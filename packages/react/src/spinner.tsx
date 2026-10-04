import { spinner } from "@animic/styled-system/recipes";
import { Text } from "./text";
export interface SpinnerProps {
  label: string;
}
export function Spinner({ label }: SpinnerProps) {
  return (
    <span role="status">
      <span aria-hidden="true" className={spinner()} /> <Text>{label}</Text>
    </span>
  );
}
