import type { ReactNode } from "react";

import emptyStateStyles from "./empty-state.module.css";

export type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  /** 次の操作（追加する・条件を外す・再読み込みなど） */
  actions?: ReactNode;
  /** 読み込みの失敗など、読み上げで伝えるときはalert */
  role?: "status" | "alert";
};

// 中身がないときの表示
export function EmptyState({ title, children, actions, role }: EmptyStateProps) {
  return (
    <div className={emptyStateStyles.root} role={role}>
      <p className={emptyStateStyles.title}>{title}</p>
      {children ? <p className={emptyStateStyles.body}>{children}</p> : null}
      {actions ? <div className={emptyStateStyles.actions}>{actions}</div> : null}
    </div>
  );
}
