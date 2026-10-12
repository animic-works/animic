import type { MouseEventHandler } from "react";
import { sectionNavigation } from "@animic/styled-system/recipes";
export interface SectionNavigationProps {
  label: string;
  items: readonly { id: string; label: string; href: string }[];
  current: string;
  onNavigate?: (id: string) => void;
}
export function SectionNavigation({ label, items, current, onNavigate }: SectionNavigationProps) {
  const classes = sectionNavigation();
  return (
    <nav className={classes.root} aria-label={label} data-animic-section-links="">
      {items.map((item) => {
        const onClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
          if (
            !onNavigate ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          onNavigate(item.id);
        };
        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.label}
            aria-current={current === item.id ? "location" : undefined}
            suppressHydrationWarning
            onClick={onClick}
            className={classes.item}
          />
        );
      })}
    </nav>
  );
}
