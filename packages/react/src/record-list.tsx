import type { ReactNode } from "react";
import { recordList } from "@animic/styled-system/recipes";
export function RecordList({
  children,
  label,
  layout = "list",
  entering = false,
}: {
  children: ReactNode;
  label: string;
  layout?: "list" | "grid";
  entering?: boolean;
}) {
  return (
    <ol className={recordList({ layout, entering }).root} aria-label={label}>
      {children}
    </ol>
  );
}
export interface RecordItemProps {
  imagePosition?: "start" | "after-leading";
  href?: string;
  label?: string;
  leading?: ReactNode;
  image?: string | null;
  avatar?: ReactNode;
  children: ReactNode;
  supplement?: ReactNode;
  value?: ReactNode;
  emphasis?: boolean;
  density?: "comfortable" | "compact";
}
export function RecordItem(props: RecordItemProps) {
  const c = recordList({
    emphasis: props.emphasis,
    density: props.density,
    imagePosition: props.imagePosition,
  });
  const content = (
    <>
      {props.leading && <div className={c.leading}>{props.leading}</div>}
      {props.image !== undefined && (
        <div className={c.image}>{props.image && <img src={props.image} alt="" />}</div>
      )}
      {props.avatar && <div className={c.avatar}>{props.avatar}</div>}
      <div className={c.body}>{props.children}</div>
      {props.supplement && <div className={c.supplement}>{props.supplement}</div>}
      {props.value && <div className={c.value}>{props.value}</div>}
    </>
  );
  return (
    <li>
      {props.href ? (
        <a href={props.href} className={c.row} aria-label={props.label}>
          {content}
        </a>
      ) : (
        <div className={c.row}>{content}</div>
      )}
    </li>
  );
}
