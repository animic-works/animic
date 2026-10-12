import { useId, type ReactNode } from "react";
import { outputPanel } from "@animic/styled-system/recipes";
import { useScrollViewport } from "./use-scroll-viewport";

export function OutputPanel({
  title,
  value,
  children,
}: {
  title: string;
  value?: ReactNode;
  children: ReactNode;
}) {
  const c = outputPanel();
  const titleId = useId();
  const { ref, scrollbars } = useScrollViewport<HTMLDivElement>(title);
  return (
    <section className={c.root} aria-labelledby={titleId}>
      <div className={c.heading}>
        <strong id={titleId} className={c.title}>
          {title}
        </strong>
        {value != null && <span className={c.value}>{value}</span>}
      </div>
      <div
        className={c.body}
        ref={ref}
        data-animic-scroll-viewport=""
        tabIndex={0}
        role="region"
        aria-label={`${title}の出力`}
      >
        {children}
      </div>
      {scrollbars}
    </section>
  );
}

export function OutputTags({
  groups,
}: {
  groups: readonly {
    label: string;
    items: readonly { label: string; value?: string; highlighted?: boolean }[];
  }[];
}) {
  const c = outputPanel();
  return (
    <div className={c.groups}>
      {groups.map((group) => (
        <div className={c.group} key={group.label}>
          <span className={c.label}>{group.label}</span>
          <ul className={c.tags} aria-label={group.label}>
            {group.items.map((item) => (
              <li
                key={item.label}
                className={c.tag}
                data-highlighted={item.highlighted || undefined}
              >
                {item.label}
                {item.value && <span className={c.confidence}>{item.value}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
