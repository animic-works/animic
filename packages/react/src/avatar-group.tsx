import { useScrollViewport } from "./use-scroll-viewport";
import type { ReactNode } from "react";
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
    detail: string;
    current?: boolean;
    state?: "pending" | "active" | "complete";
    value?: string;
    marker?: { value: string; label: string };
  }[];
  label: string;
  presentation?: "compact" | "expanded";
}) {
  const { ref: scrollingRef, scrollbars: scrollingBars } =
    useScrollViewport<HTMLOListElement>(label);
  const c = avatarGroup({ presentation });
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
              <span className={c.name}>{member.name}</span>
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
