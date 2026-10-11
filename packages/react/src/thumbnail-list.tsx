import { useScrollViewport } from "./use-scroll-viewport";
import { useEffect, useRef, type ReactNode } from "react";
import { thumbnailList } from "@animic/styled-system/recipes";
type ThumbnailListProps = {
  label: string;
  items: readonly {
    id: string;
    src?: string;
    label: string;
    /** 画像に重ねる短い表示（例: `#3`）。読み上げには`label`を使う。省略すると`label`を表示する。 */
    badge?: string;
    content?: ReactNode;
    /** `current`を使う一覧で、表示とは別の状態を✓で示す。状態は`label`にも含める。 */
    checked?: boolean;
    disabled?: boolean;
    entering?: boolean;
  }[];
  onValueChange: (id: string) => void;
  disabled?: boolean;
  empty: ReactNode;
  compactEmpty?: ReactNode;
  /** `strip`は画面幅にかかわらず横1列に並べる。 */
  layout?: "adaptive" | "strip";
} & (
  | {
      /** 選んだ項目。`aria-pressed`と✓で示す。 */
      value?: string;
      current?: never;
    }
  | {
      /** 表示中の項目。`aria-current`と枠で示し、見える位置まで一覧をスクロールする。Tabではこの項目だけに止まる。 */
      current: string;
      value?: never;
    }
);
export function ThumbnailList({
  label,
  items,
  value,
  current,
  onValueChange,
  disabled,
  empty,
  compactEmpty,
  layout,
}: ThumbnailListProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const { ref: scrollingRef, scrollbars: scrollingBars } = useScrollViewport<HTMLOListElement>(
    label,
    listRef,
  );
  const scrolled = useRef(false);
  // 表示中の項目が一覧の外にあれば、一覧だけをスクロールする（ページやダイアログは動かさない）。
  useEffect(() => {
    const list = listRef.current;
    if (!list || current === undefined) return;
    const target = list.querySelector<HTMLElement>("[aria-current=true]");
    if (!target) return;
    // 一覧の中にフォーカスがあれば、表示中の項目へ移す（←→で移ったときに枠とフォーカスをそろえる）。
    if (list.contains(document.activeElement) && document.activeElement !== target)
      target.focus({ preventScroll: true });
    const area = list.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const margin = 8;
    const left =
      box.left < area.left
        ? box.left - area.left - margin
        : box.right > area.right
          ? box.right - area.right + margin
          : 0;
    const top =
      box.top < area.top
        ? box.top - area.top - margin
        : box.bottom > area.bottom
          ? box.bottom - area.bottom + margin
          : 0;
    const smooth = scrolled.current && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrolled.current = true;
    if (left || top) list.scrollBy({ left, top, behavior: smooth ? "smooth" : "auto" });
  }, [current]);
  const c = thumbnailList({ layout });
  const roving = current !== undefined && items.some((item) => item.id === current);
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
        {items.map((item) => {
          const checked = current === undefined ? value === item.id : item.checked;
          return (
            <li key={item.id} className={c.item}>
              <button
                type="button"
                className={thumbnailList({ layout, entering: item.entering }).button}
                aria-label={item.label}
                aria-pressed={current === undefined ? value === item.id : undefined}
                aria-current={current === item.id ? "true" : undefined}
                // 表示中の項目へ移る一覧では、Tabで止まるのを表示中の項目だけにする。
                tabIndex={roving && current !== item.id ? -1 : undefined}
                disabled={disabled || item.disabled}
                onClick={() => onValueChange(item.id)}
              >
                {item.src ? (
                  <img src={item.src} alt="" className={c.image} draggable={false} />
                ) : (
                  item.content
                )}
                <span className={c.label} aria-hidden={item.badge ? true : undefined}>
                  {item.badge ?? item.label}
                </span>
                {checked && (
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
          );
        })}
      </ol>
      {scrollingBars}
    </>
  );
}
