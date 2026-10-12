import { scrollAxis, type ScrollAxis } from "./scroll-metrics";

export interface ScrollbarGeometry {
  x: ScrollAxis;
  y: ScrollAxis;
  rtl: boolean;
}

function pixels(node: HTMLElement, property: string, value: number) {
  const next = `${value}px`;
  if (node.style.getPropertyValue(property) !== next) node.style.setProperty(property, next);
}
function attribute(node: HTMLElement, name: string, value: string) {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

/** 計測と描画を分け、スクロール中はつまみのtransformとARIAだけを更新する。 */
export function observeScrollbars(
  viewport: HTMLElement,
  layer: HTMLElement,
  documentScroll: boolean,
  onGeometry: (geometry: ScrollbarGeometry | null) => void,
) {
  const doc = viewport.ownerDocument;
  const win = doc.defaultView!;
  const vertical = layer.querySelector<HTMLElement>('[aria-orientation="vertical"]')!;
  const horizontal = layer.querySelector<HTMLElement>('[aria-orientation="horizontal"]')!;
  const tracks = [horizontal, vertical];
  const thumbs = tracks.map((track) => track.querySelector<HTMLElement>(":scope > div")!);
  const ancestors: HTMLElement[] = [];
  for (let node: HTMLElement | null = viewport; node; node = node.parentElement)
    ancestors.push(node);
  let geometry: ScrollbarGeometry | null = null;
  let frame = 0;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let moving = false;
  let disposed = false;

  function paintPosition() {
    if (!geometry) return;
    const { x, y, rtl } = geometry;
    const position = [viewport.scrollLeft + (rtl ? x.maximum : 0), viewport.scrollTop];
    for (const [index, axis] of [x, y].entries()) {
      Object.assign(
        axis,
        scrollAxis(position[index], axis.page, axis.maximum + axis.page, axis.length, axis.thumb),
      );
      pixels(thumbs[index], "--animic-thumb-offset", axis.offset);
      attribute(tracks[index], "aria-valuenow", String(Math.round(axis.position)));
    }
    onGeometry(geometry);
  }
  function hide() {
    geometry = null;
    onGeometry(null);
    for (const track of tracks) track.removeAttribute("data-visible");
  }
  function update() {
    if (disposed) return;
    const styles = getComputedStyle(viewport);
    if (
      documentScroll &&
      [styles.overflowY, getComputedStyle(doc.body).overflowY].includes("hidden")
    ) {
      hide();
      return;
    }
    const visual = win.visualViewport;
    const bounds = viewport.getBoundingClientRect();
    const host = layer.getBoundingClientRect();
    const appearance = getComputedStyle(layer);
    // Dialogのscale/translateを含む画面座標から、バーの包含ブロックへ戻す。
    // clientHeightは整数に丸められるため、拡縮率には小数を保つCSS寸法を使う。
    const hostWidth = parseFloat(appearance.width);
    const hostHeight = parseFloat(appearance.height);
    const scaleX = !documentScroll && hostWidth ? host.width / hostWidth : 1;
    const scaleY = !documentScroll && hostHeight ? host.height / hostHeight : 1;
    const viewportScaleX =
      !documentScroll && viewport.offsetWidth ? bounds.width / viewport.offsetWidth : 1;
    const viewportScaleY =
      !documentScroll && viewport.offsetHeight ? bounds.height / viewport.offsetHeight : 1;
    let top = documentScroll ? 0 : bounds.top + viewport.clientTop * viewportScaleY;
    let left = documentScroll ? 0 : bounds.left + viewport.clientLeft * viewportScaleX;
    let right = documentScroll
      ? (visual?.width ?? win.innerWidth)
      : left + viewport.clientWidth * viewportScaleX;
    let bottom = documentScroll
      ? (visual?.height ?? win.innerHeight)
      : top + viewport.clientHeight * viewportScaleY;
    if (!documentScroll) {
      for (const parent of ancestors.slice(1)) {
        const style = getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        const sx = parent.offsetWidth ? rect.width / parent.offsetWidth : 1;
        const sy = parent.offsetHeight ? rect.height / parent.offsetHeight : 1;
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
          const edge = rect.top + parent.clientTop * sy;
          top = Math.max(top, edge);
          bottom = Math.min(bottom, edge + parent.clientHeight * sy);
        }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
          const edge = rect.left + parent.clientLeft * sx;
          left = Math.max(left, edge);
          right = Math.min(right, edge + parent.clientWidth * sx);
        }
      }
      top = Math.max(visual?.offsetTop ?? 0, top);
      left = Math.max(visual?.offsetLeft ?? 0, left);
      right = Math.min((visual?.offsetLeft ?? 0) + (visual?.width ?? win.innerWidth), right);
      bottom = Math.min((visual?.offsetTop ?? 0) + (visual?.height ?? win.innerHeight), bottom);
    }
    if (right <= left || bottom <= top || !scaleX || !scaleY || !viewport.getClientRects().length) {
      hide();
      return;
    }
    const thickness = parseFloat(appearance.getPropertyValue("--animic-scrollbar-thickness")) || 0;
    const minimum = parseFloat(appearance.getPropertyValue("--animic-scrollbar-min-thumb")) || 0;
    const hasX =
      (documentScroll || /(auto|scroll)/.test(styles.overflowX)) &&
      viewport.scrollWidth > viewport.clientWidth + 1;
    const hasY =
      (documentScroll || /(auto|scroll)/.test(styles.overflowY)) &&
      viewport.scrollHeight > viewport.clientHeight + 1;
    const width = (right - left) / scaleX;
    const height = (bottom - top) / scaleY;
    const rtl = styles.direction === "rtl";
    geometry = {
      x: scrollAxis(
        0,
        viewport.clientWidth,
        hasX ? viewport.scrollWidth : viewport.clientWidth,
        Math.max(0, width - (hasY ? thickness : 0)),
        minimum,
      ),
      y: scrollAxis(
        0,
        viewport.clientHeight,
        hasY ? viewport.scrollHeight : viewport.clientHeight,
        Math.max(0, height - (hasX ? thickness : 0)),
        minimum,
      ),
      rtl,
    };
    // ここから描画。寸法を読む処理を後ろへ混ぜない。
    layer.toggleAttribute("data-rtl", rtl);
    layer.toggleAttribute("data-horizontal", hasX);
    layer.toggleAttribute("data-vertical", hasY);
    if (documentScroll) {
      // 通常時の画面端はCSSのinsetで固定する。拡大・ソフトウェアキーボード時だけ補正する。
      pixels(layer, "--animic-viewport-top", visual?.offsetTop ?? 0);
      pixels(layer, "--animic-viewport-left", visual?.offsetLeft ?? 0);
      for (const [property, value, normal] of [
        ["--animic-viewport-width", width, win.innerWidth],
        ["--animic-viewport-height", height, win.innerHeight],
      ] as const) {
        if (Math.abs(value - normal) < 1) layer.style.removeProperty(property);
        else pixels(layer, property, value);
      }
    } else {
      pixels(layer, "--animic-track-top", (top - host.top) / scaleY);
      pixels(layer, "--animic-track-left", (left - host.left) / scaleX);
      pixels(layer, "--animic-track-right", (host.right - right) / scaleX);
      pixels(layer, "--animic-track-bottom", (host.bottom - bottom) / scaleY);
    }
    for (const [index, axis] of [geometry.x, geometry.y].entries()) {
      const visible = axis.maximum > 1 && axis.length > 0;
      tracks[index].toggleAttribute("data-visible", visible);
      attribute(tracks[index], "aria-valuemax", String(Math.round(axis.maximum)));
      pixels(thumbs[index], "--animic-thumb-size", axis.thumb);
    }
    paintPosition();
  }
  function animate() {
    frame = 0;
    update();
    if (moving) {
      moving = ancestors.some((node) =>
        node.getAnimations().some((animation) => animation.playState === "running"),
      );
      if (moving) frame = requestAnimationFrame(animate);
    }
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(animate);
  };
  const motion = (event: Event) => {
    if (event.target instanceof Element && event.target.contains(viewport)) {
      moving = true;
      schedule();
    }
  };
  const activate = () => {
    layer.setAttribute("data-active", "");
    clearTimeout(idle);
    idle = setTimeout(() => layer.removeAttribute("data-active"), 1000);
  };
  const approach = (event: PointerEvent) => {
    if (event.pointerType === "touch" || !geometry || layer.hasAttribute("data-active")) return;
    // 非表示のトラックは本文のポインター操作を遮らず、端へ近づいたときに操作可能にする。
    const entered = tracks.some((track) => {
      if (!track.hasAttribute("data-visible")) return false;
      const rect = track.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    });
    if (entered) activate();
  };
  const scroll = (event: Event) => {
    if (event.target !== viewport && !(documentScroll && event.target === doc)) {
      if (!documentScroll) schedule();
      return;
    }
    paintPosition();
    activate();
  };
  const resize = new ResizeObserver(update);
  resize.observe(viewport);
  resize.observe(layer);
  if (documentScroll) resize.observe(doc.body);
  const observed = new Set<Element>();
  function observeChildren() {
    const children = new Set([...viewport.children].filter((child) => child !== layer));
    for (const child of observed)
      if (!children.has(child)) {
        resize.unobserve(child);
        observed.delete(child);
      }
    for (const child of children)
      if (!observed.has(child)) {
        resize.observe(child);
        observed.add(child);
      }
  }
  const content = new MutationObserver(() => {
    observeChildren();
    schedule();
  });
  if (!documentScroll) {
    observeChildren();
    content.observe(viewport, { childList: true, subtree: true, characterData: true });
  }
  const attributes = new MutationObserver(schedule);
  for (const ancestor of ancestors)
    attributes.observe(ancestor, { attributes: true, attributeFilter: ["dir", "class", "style"] });
  if (documentScroll)
    attributes.observe(doc.body, { attributes: true, attributeFilter: ["style"] });
  doc.addEventListener("scroll", scroll, true);
  doc.addEventListener("pointermove", approach, { passive: true });
  doc.addEventListener("animationstart", motion, true);
  doc.addEventListener("transitionrun", motion, true);
  viewport.addEventListener("input", schedule);
  win.addEventListener("resize", schedule);
  visualListeners(true);
  function visualListeners(add: boolean) {
    if (add) {
      win.visualViewport?.addEventListener("resize", update);
      win.visualViewport?.addEventListener("scroll", update);
    } else {
      win.visualViewport?.removeEventListener("resize", update);
      win.visualViewport?.removeEventListener("scroll", update);
    }
  }
  update();
  return {
    update,
    updatePosition: paintPosition,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      resize.disconnect();
      content.disconnect();
      attributes.disconnect();
      doc.removeEventListener("scroll", scroll, true);
      doc.removeEventListener("pointermove", approach);
      doc.removeEventListener("animationstart", motion, true);
      doc.removeEventListener("transitionrun", motion, true);
      viewport.removeEventListener("input", schedule);
      win.removeEventListener("resize", schedule);
      visualListeners(false);
    },
  };
}
