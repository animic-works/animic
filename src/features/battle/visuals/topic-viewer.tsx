import { useState, type PointerEvent, type WheelEvent } from "react";
import { css } from "@animic/styled-system/css";

// お題をじっくり見るための拡大表示。拡大中はドラッグで動かせる。
const frame = css({
  position: "relative",
  overflow: "hidden",
  width: "[100%]",
  height: "[min(70svh, 44rem)]",
});
const viewerImage = css({ position: "absolute", inset: "[0]", width: "[100%]", height: "[100%]" });

export const topicZoomLevels = [1, 2, 3] as const;

/** `zoom`の倍率で表示し、ドラッグ・ホイールで動かす。倍率は呼び出し元が持つ。 */
export function TopicViewer({
  src,
  alt,
  zoom,
  onZoomChange,
}: {
  src: string;
  alt: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const shown = clampOffset(offset, zoom, size);
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    setDrag({ x: event.clientX - shown.x, y: event.clientY - shown.y });
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setOffset(clampOffset({ x: event.clientX - drag.x, y: event.clientY - drag.y }, zoom, size));
  }
  function onWheel(event: WheelEvent<HTMLDivElement>) {
    const index = topicZoomLevels.findIndex((level) => level === zoom);
    const next = topicZoomLevels[index + (event.deltaY < 0 ? 1 : -1)];
    if (next !== undefined) onZoomChange(next);
  }
  return (
    <div
      className={frame}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      onWheel={onWheel}
      onDoubleClick={() => onZoomChange(zoom === 1 ? 2 : 1)}
    >
      <svg
        className={viewerImage}
        viewBox="0 0 832 1216"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={alt}
      >
        {/* 画面上のずれを、画像の座標（832×1216）に直して動かす。 */}
        <g
          transform={`translate(${416 + (shown.x * 832) / (size?.width ?? 832)} ${608 + (shown.y * 1216) / (size?.height ?? 1216)}) scale(${zoom}) translate(-416 -608)`}
        >
          <image href={src} width="832" height="1216" />
        </g>
      </svg>
    </div>
  );
}

// 拡大した分だけ動かせる範囲を制限し、画像の外を見せない。
function clampOffset(
  next: { x: number; y: number },
  scale: number,
  rect: { width: number; height: number } | null,
) {
  if (!rect || scale <= 1) return { x: 0, y: 0 };
  const limitX = (rect.width * (scale - 1)) / 2;
  const limitY = (rect.height * (scale - 1)) / 2;
  return {
    x: Math.max(-limitX, Math.min(limitX, next.x)),
    y: Math.max(-limitY, Math.min(limitY, next.y)),
  };
}
