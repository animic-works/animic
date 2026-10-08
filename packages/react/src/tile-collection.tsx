import { Children, type ReactNode } from "react";
import { tileCollection } from "@animic/styled-system/recipes";
export function TileCollection({
  children,
  capacity = 0,
  label,
}: {
  children: ReactNode;
  capacity?: number;
  label: string;
}) {
  const items = Children.toArray(children);
  const c = tileCollection();
  return (
    <ul className={c.root} aria-label={label}>
      {Array.from({ length: Math.max(items.length, capacity) }, (_, i) => (
        <li key={i} className={c.item} aria-hidden={i >= items.length || undefined}>
          {items[i]}
        </li>
      ))}
    </ul>
  );
}
export interface TileProps {
  media?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
  appearance?: "outline" | "placeholder";
  onClick?: () => void;
  label?: string;
}
export function Tile(props: TileProps) {
  const c = tileCollection({
    selected: props.selected,
    appearance: props.appearance,
    interactive: Boolean(props.onClick),
  });
  const content = (
    <>
      {props.badge && <div className={c.badge}>{props.badge}</div>}
      {props.media && <div className={c.media}>{props.media}</div>}
      <div className={c.body}>{props.children}</div>
      {props.footer && <div className={c.footer}>{props.footer}</div>}
    </>
  );
  return props.onClick ? (
    <button type="button" className={c.tile} aria-label={props.label} onClick={props.onClick}>
      {content}
    </button>
  ) : (
    <div className={c.tile}>{content}</div>
  );
}
