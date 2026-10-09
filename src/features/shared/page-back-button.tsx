import { Button } from "@animic/react/button";
import { ArrowIcon } from "./icons";

export function PageBackButton({
  label = "戻る",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button appearance="quiet" leadingIcon={<ArrowIcon direction="left" />} onClick={onClick}>
      {label}
    </Button>
  );
}
