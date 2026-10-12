import { useSyncExternalStore, useLayoutEffect, useRef, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { scrollbar } from "@animic/styled-system/recipes";
import { scrollKey } from "./scroll-metrics";
import { observeScrollbars, type ScrollbarGeometry } from "./observe-scrollbars";

const classes = scrollbar();
type Axis = "vertical" | "horizontal";

/** スクロールはブラウザが所有し、バーの位置だけを描画へ同期する。 */
export function Scrollbars({
  viewport,
  label,
  documentScroll = false,
  revision,
}: {
  viewport: HTMLElement | null;
  label: string;
  documentScroll?: boolean;
  revision?: string;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const geometry = useRef<ScrollbarGeometry | null>(null);
  const measure = useRef<() => void>(() => {});
  const updatePosition = useRef<() => void>(() => {});
  const drag = useRef<{ coordinate: number; position: number; axis: Axis; ratio: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!viewport || !layer.current) return undefined;
    const observer = observeScrollbars(viewport, layer.current, documentScroll, (value) => {
      geometry.current = value;
    });
    measure.current = observer.update;
    updatePosition.current = observer.updatePosition;
    return () => {
      observer.dispose();
      measure.current = () => {};
      updatePosition.current = () => {};
      drag.current = null;
      viewport.removeAttribute("data-animic-scroll-dragging");
    };
  }, [viewport, documentScroll]);

  useLayoutEffect(() => {
    if (revision !== undefined) measure.current();
  }, [revision]);

  if (!viewport) return null;
  const move = (axis: Axis, position: number) => {
    const current = geometry.current;
    if (!current) return;
    const value = axis === "vertical" ? current.y : current.x;
    const next = Math.max(0, Math.min(value.maximum, position));
    viewport.scrollTo({
      ...(axis === "vertical" ? { top: next } : { left: next - (current.rtl ? value.maximum : 0) }),
      behavior: "instant",
    });
    // ポインター操作の描画を次のReact commitやscrollイベントまで待たせない。
    updatePosition.current();
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    event.currentTarget.removeAttribute("data-dragging");
    viewport.removeAttribute("data-animic-scroll-dragging");
    measure.current();
  };
  function pointerDown(event: PointerEvent<HTMLDivElement>, axis: Axis) {
    const current = geometry.current;
    if (event.button !== 0 || !current) return;
    const value = axis === "vertical" ? current.y : current.x;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    const box = event.currentTarget.getBoundingClientRect();
    const coordinate = axis === "vertical" ? event.clientY : event.clientX;
    const scale = (axis === "vertical" ? box.height : box.width) / value.length;
    const local = (coordinate - (axis === "vertical" ? box.top : box.left)) / scale;
    if (local < value.offset || local > value.offset + value.thumb) {
      move(axis, value.position + (local < value.offset ? -1 : 1) * value.page);
      return;
    }
    viewport!.setAttribute("data-animic-scroll-dragging", "");
    drag.current = {
      coordinate,
      position: value.position,
      axis,
      ratio: value.maximum / Math.max(1, (value.length - value.thumb) * scale),
    };
    event.currentTarget.setAttribute("data-dragging", "");
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  return createPortal(
    <div
      ref={layer}
      className={classes.layer}
      data-animic-scrollbars=""
      data-document={documentScroll || undefined}
    >
      {(["vertical", "horizontal"] as const).map((axis) => (
        <div
          key={axis}
          className={classes.track}
          role="scrollbar"
          tabIndex={0}
          aria-label={`${label}（${axis === "vertical" ? "縦" : "横"}スクロール）`}
          aria-controls={viewport.id}
          aria-orientation={axis}
          aria-valuemin={0}
          aria-valuemax={0}
          aria-valuenow={0}
          onPointerDown={(event) => pointerDown(event, axis)}
          onPointerMove={(event) => {
            if (!drag.current || drag.current.axis !== axis) return;
            const coordinate = axis === "vertical" ? event.clientY : event.clientX;
            move(
              axis,
              drag.current.position + (coordinate - drag.current.coordinate) * drag.current.ratio,
            );
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={(event) => {
            const current = geometry.current;
            if (!current) return;
            const value = axis === "vertical" ? current.y : current.x;
            const next = scrollKey(event.key, event.shiftKey, axis, value);
            if (next === null || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            event.stopPropagation();
            move(axis, next);
          }}
        >
          <div className={classes.thumb} />
        </div>
      ))}
    </div>,
    documentScroll
      ? viewport.ownerDocument.body
      : viewport.matches("[data-animic-dialog], [data-scope=popover][data-part=content]")
        ? viewport
        : viewport.parentElement!,
  );
}

const subscribeDocument = () => () => {};
const browserDocument = () => document.documentElement;
const serverDocument = () => null;
export function DocumentScrollbars() {
  const viewport = useSyncExternalStore(subscribeDocument, browserDocument, serverDocument);
  return <Scrollbars viewport={viewport} documentScroll label="ページ" />;
}
