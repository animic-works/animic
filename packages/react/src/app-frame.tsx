import type { ReactNode } from "react";
import { appFrame } from "@animic/styled-system/recipes";
import { domProps, type CommonProps } from "./dom";

export interface AppFrameProps extends CommonProps {
  brand: ReactNode;
  context?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  compactContext?: ReactNode;
  compactActions?: ReactNode;
  progress?: ReactNode;
  width?: "reading" | "wide" | "full" | "content";
  bottomAction?: boolean;
}
export function AppFrame({ ref, ...props }: AppFrameProps) {
  const c = appFrame({
    width: props.width,
    brandOnly: !props.context && !props.actions && !props.progress && props.width !== "full",
    bottomAction: props.bottomAction,
    compactControls: props.compactContext !== undefined || props.compactActions !== undefined,
  });
  return (
    <div {...domProps(props)} ref={ref} className={c.root}>
      <header className={c.header}>
        <div className={c.brand}>{props.brand}</div>
        <div className={c.context}>{props.context}</div>
        <div className={c.actions}>{props.actions}</div>
        <div className={c.compactContext}>{props.compactContext}</div>
        <div className={c.compactActions}>{props.compactActions}</div>
      </header>
      {props.progress && <div className={c.progress}>{props.progress}</div>}
      <main className={c.main}>{props.children}</main>
      {props.footer && <footer className={c.footer}>{props.footer}</footer>}
    </div>
  );
}

export function AppFrameWideContent({ ref, ...props }: CommonProps) {
  return (
    <div {...domProps(props)} ref={ref} className={appFrame().wideContent}>
      {props.children}
    </div>
  );
}
