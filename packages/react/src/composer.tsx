import type { ReactNode } from "react";
import { composer } from "@animic/styled-system/recipes";
export function Composer({
  title,
  eyebrow,
  controls,
  tabs,
  children,
  tools,
  summary,
  action,
}: {
  title: ReactNode;
  eyebrow?: string;
  controls: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
  tools: ReactNode;
  summary: ReactNode;
  action: ReactNode;
}) {
  const c = composer();
  return (
    <div className={c.root}>
      <div className={c.header}>
        <div className={c.title}>
          {eyebrow && <div className={c.eyebrow}>{eyebrow}</div>}
          {title}
        </div>
        <div className={c.controls}>{controls}</div>
      </div>
      <div className={c.tabs}>{tabs}</div>
      <div className={c.input}>{children}</div>
      <div className={c.tools}>{tools}</div>
      <div className={c.footer}>
        <div className={c.summary}>{summary}</div>
        <div className={c.action}>{action}</div>
      </div>
    </div>
  );
}
