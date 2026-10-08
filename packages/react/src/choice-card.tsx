import type { ReactNode } from "react";
import { choiceCard } from "@animic/styled-system/recipes";
export function ChoiceCard({
  src,
  label,
  children,
  selected,
  disabled,
  onSelect,
}: {
  src?: string;
  label: string;
  children: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const c = choiceCard();
  return (
    <button
      type="button"
      className={c.root}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {src && <img src={src} alt="" className={c.media} />}
      <span className={c.body}>{children}</span>
    </button>
  );
}
