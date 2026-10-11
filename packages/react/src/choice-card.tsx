import type { ReactNode } from "react";
import { choiceCard } from "@animic/styled-system/recipes";
type ChoiceCardProps = {
  label: string;
  children: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
} & ({ src?: string; media?: never } | { media: ReactNode; src?: never });
export function ChoiceCard({
  src,
  media,
  label,
  children,
  selected,
  disabled,
  onSelect,
}: ChoiceCardProps) {
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
      {media ? (
        <span className={c.media}>{media}</span>
      ) : src ? (
        <img src={src} alt="" className={c.media} draggable={false} />
      ) : null}
      {selected && (
        <span className={c.indicator} aria-hidden="true">
          ✓
        </span>
      )}
      <span className={c.body}>{children}</span>
    </button>
  );
}
