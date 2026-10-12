import { useEffect, useRef, type ReactNode } from "react";
import { useScrollViewport } from "./use-scroll-viewport";
import { avatarGroup } from "@animic/styled-system/recipes";
export function AvatarGroup({
  summary,
  members,
  label,
  presentation,
}: {
  summary?: ReactNode;
  members: readonly {
    id: string;
    avatar: ReactNode;
    name: string;
    /** 表示する短い名前。読み上げとツールチップには`name`を使う。 */
    displayName?: string;
    detail: string;
    current?: boolean;
    state?: "pending" | "active" | "complete";
    value?: string;
    marker?: { value: string; label: string };
  }[];
  label: string;
  presentation?: "compact" | "expanded";
}) {
  const list = useRef<HTMLOListElement>(null);
  const { ref: scrollingRef, scrollbars: scrollingBars } = useScrollViewport<HTMLOListElement>(
    label,
    list,
  );
  // 横にスクロールする一覧では、進行中（active）の項目が見えるよう一覧の中央へ寄せる。ページはスクロールしない。
  const active = members.findIndex((member) => member.state === "active");
  useEffect(() => {
    const viewport = list.current;
    const item = viewport?.children[active];
    if (!viewport || !(item instanceof HTMLElement)) return;
    const bounds = viewport.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    viewport.scrollBy({
      left: box.left + box.width / 2 - (bounds.left + bounds.width / 2),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [active]);
  const c = avatarGroup({ presentation, crowded: members.length > 3 });
  return (
    <div className={c.frame}>
      {summary && <div className={c.summary}>{summary}</div>}
      <ol
        className={c.root}
        data-animic-scroll-viewport=""
        ref={scrollingRef}
        aria-label={label}
        tabIndex={0}
      >
        {members.map((member) => (
          <li
            key={member.id}
            className={c.item}
            title={`${member.name}: ${member.detail}`}
            aria-label={`${member.name}: ${member.detail}${member.value ? ` ${member.value}` : ""}${member.marker ? ` ${member.marker.label}` : ""}`}
            data-current={member.current || undefined}
            data-state={member.state}
          >
            {member.marker && (
              <span className={c.marker} aria-hidden="true">
                {member.marker.value}
              </span>
            )}
            {member.avatar}
            <span className={c.text}>
              <span className={c.name}>{member.displayName ?? member.name}</span>
              <span className={c.detail}>{member.detail}</span>
            </span>
            {member.value && (
              <span className={c.value} aria-hidden="true">
                {member.value}
              </span>
            )}
          </li>
        ))}
      </ol>
      {scrollingBars}
    </div>
  );
}
