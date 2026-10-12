import type { ReactNode } from "react";
import { choiceCard } from "@animic/styled-system/recipes";
type ChoiceCardProps = {
  label: string;
  children: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
} & ({ src?: string; media?: never } | { media: ReactNode; src?: never }) &
  // 選択とは別に、プレビューを大きく見るなどの操作を画像の角に置く。読み上げ名は利用側が渡す。
  ({ onOpen: () => void; openLabel: string } | { onOpen?: never; openLabel?: never });
export function ChoiceCard({
  src,
  media,
  label,
  children,
  selected,
  disabled,
  onSelect,
  onOpen,
  openLabel,
}: ChoiceCardProps) {
  const c = choiceCard();
  return (
    <div className={c.frame}>
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
      {onOpen && (
        <button type="button" className={c.action} aria-label={openLabel} onClick={onOpen}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m20 20-4.6-4.6M10.5 7.5v6M7.5 10.5h6" />
          </svg>
        </button>
      )}
    </div>
  );
}
