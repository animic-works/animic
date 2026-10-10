import { useScrollViewport } from "./use-scroll-viewport";
import { useId, useRef, type ReactNode } from "react";
import { workspace } from "@animic/styled-system/recipes";
export interface WorkspaceProps {
  headerStart: ReactNode;
  headerDetail?: ReactNode;
  headerCenter: ReactNode;
  headerEnd: ReactNode;
  progress: ReactNode;
  editor: ReactNode;
  collapsedEditor?: ReactNode;
  editorLabel: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
}
export function Workspace(props: WorkspaceProps) {
  const { ref: editorScrollRef, scrollbars: editorScrollBars } = useScrollViewport<HTMLDivElement>(
    props.editorLabel,
  );
  const { ref: contentScrollRef, scrollbars: contentScrollBars } =
    useScrollViewport<HTMLElement>("作業内容");
  const c = workspace({ expanded: props.expanded });
  const id = useId();
  const start = useRef<number | null>(null);
  const dragged = useRef(false);
  return (
    <div className={c.root}>
      <div className={c.layout}>
        <header className={c.header}>
          <div className={c.start}>
            {props.headerStart}
            {props.headerDetail && <div className={c.detail}>{props.headerDetail}</div>}
          </div>
          <div className={c.center}>{props.headerCenter}</div>
          <div className={c.end}>{props.headerEnd}</div>
        </header>
        <div className={c.progress}>{props.progress}</div>
        <main className={c.body}>
          <section className={c.editor} aria-label={props.editorLabel}>
            <button
              className={c.grip}
              type="button"
              aria-label={`${props.editorLabel}を${props.expanded ? "畳む" : "開く"}`}
              aria-controls={id}
              aria-expanded={props.expanded}
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                props.onExpandedChange(!props.expanded);
              }}
              onPointerDown={(event) => {
                start.current = event.clientY;
                dragged.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                if (start.current !== null && Math.abs(event.clientY - start.current) > 24) {
                  dragged.current = true;
                  props.onExpandedChange(event.clientY < start.current);
                }
                start.current = null;
              }}
              onPointerCancel={() => {
                start.current = null;
                dragged.current = false;
              }}
            />
            <div className={c.collapsed}>{props.collapsedEditor}</div>
            <div
              id={id}
              className={c.editorBody}
              ref={editorScrollRef}
              data-animic-scroll-viewport=""
            >
              {props.editor}
            </div>
            {editorScrollBars}
          </section>
          <section className={c.main} ref={contentScrollRef} data-animic-scroll-viewport="">
            {props.children}
          </section>
          {contentScrollBars}
        </main>
      </div>
    </div>
  );
}
