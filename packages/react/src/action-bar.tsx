import type { ReactNode } from "react";
import { actionBar } from "@animic/styled-system/recipes";
import { domProps, type CommonProps } from "./dom";
export interface ActionBarProps extends CommonProps {
  summary?: ReactNode;
  tone?: "neutral" | "success";
}
export function ActionBar({ ref, ...props }: ActionBarProps) {
  const c = actionBar({ summary: Boolean(props.summary), tone: props.tone });
  return (
    <div {...domProps(props)} ref={ref} className={c.root}>
      {props.summary && <div className={c.summary}>{props.summary}</div>}
      <div className={c.actions}>{props.children}</div>
    </div>
  );
}
