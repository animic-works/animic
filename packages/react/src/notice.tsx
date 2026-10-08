import type { ReactNode } from "react";
import { notice } from "@animic/styled-system/recipes";

export interface NoticeProps {
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: "primary" | "neutral" | "success" | "danger";
  density?: "normal" | "compact";
}
export function Notice({ title, children, icon, actions, tone, density }: NoticeProps) {
  const c = notice({ tone, density });
  return (
    <div className={c.root}>
      {icon && (
        <span className={c.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className={c.body}>
        {title != null && <div className={c.title}>{title}</div>}
        <div className={c.description}>{children}</div>
      </div>
      {actions && <div className={c.actions}>{actions}</div>}
    </div>
  );
}
