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
  peek,
  collapsed = false,
}: {
  title: ReactNode;
  eyebrow?: string;
  controls: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
  tools: ReactNode;
  summary: ReactNode;
  action: ReactNode;
  /** 畳んだときに入力欄の代わりに出す要約（開く操作）。 */
  peek?: ReactNode;
  /** 下端に畳んでいる。狭い画面で、要約と操作の行だけを出す。 */
  collapsed?: boolean;
}) {
  const c = composer({ collapsed });
  return (
    <div className={c.root}>
      <div className={c.header}>
        <div className={c.title}>
          {eyebrow && <div className={c.eyebrow}>{eyebrow}</div>}
          {title}
        </div>
        <div className={c.controls} data-animic-composer-controls="">
          {controls}
        </div>
      </div>
      <div className={c.tabs}>{tabs}</div>
      <div className={c.input}>{children}</div>
      <div className={c.tools}>{tools}</div>
      {peek && <div className={c.peek}>{peek}</div>}
      <div className={c.footer}>
        <div className={c.summary}>{summary}</div>
        <div className={c.action}>{action}</div>
      </div>
    </div>
  );
}
