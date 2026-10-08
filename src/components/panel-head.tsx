import type { ReactNode } from "react";

import panelHeadStyles from "./panel-head.module.css";

// パネルの見出し。上に英字の小見出し（01 — Prompt など）、右端に補足や操作を置ける
export function PanelHead({
  eyebrow,
  title,
  titleId,
  note,
  children,
}: {
  /** 見出しの上の英字の小見出し */
  eyebrow?: string;
  title: string;
  titleId: string;
  /** 右端の短い補足。操作を置くときは children を渡す */
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className={panelHeadStyles.root}>
      <div className={panelHeadStyles.titles}>
        {eyebrow ? <span className={panelHeadStyles.eyebrow}>{eyebrow}</span> : null}
        <h2 id={titleId} className={panelHeadStyles.title}>
          {title}
        </h2>
      </div>
      {note ? <small className={panelHeadStyles.note}>{note}</small> : children}
    </div>
  );
}
