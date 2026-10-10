import { useScrollViewport } from "./use-scroll-viewport";
import type { ReactNode } from "react";
import { thumbnailList } from "@animic/styled-system/recipes";
export function ThumbnailList({
  label,
  items,
  value,
  onValueChange,
  disabled,
  empty,
  compactEmpty,
}: {
  label: string;
  items: readonly {
    id: string;
    src?: string;
    label: string;
    content?: ReactNode;
    disabled?: boolean;
    entering?: boolean;
  }[];
  value?: string;
  onValueChange: (id: string) => void;
  disabled?: boolean;
  empty: ReactNode;
  compactEmpty?: ReactNode;
}) {
  const { ref: scrollingRef, scrollbars: scrollingBars } =
    useScrollViewport<HTMLOListElement>(label);
  const c = thumbnailList();
  if (!items.length)
    return (
      <div className={c.empty}>
        <span className={c.emptyDetail}>{empty}</span>
        <span className={c.emptyCompact}>{compactEmpty ?? empty}</span>
      </div>
    );
  return (
    <>
      <ol aria-label={label} className={c.root} data-animic-scroll-viewport="" ref={scrollingRef}>
        {items.map((item) => (
          <li key={item.id} className={c.item}>
            <button
              type="button"
              className={thumbnailList({ entering: item.entering }).button}
              aria-label={item.label}
              aria-pressed={value === item.id}
              disabled={disabled || item.disabled}
              onClick={() => onValueChange(item.id)}
            >
              {item.src ? <img src={item.src} alt="" className={c.image} /> : item.content}
              <span className={c.label}>{item.label}</span>
              {value === item.id && (
                <span className={c.selected} aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m3 8 3 3 7-7" />
                  </svg>
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
      {scrollingBars}
    </>
  );
}
