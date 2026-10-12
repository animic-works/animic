import { useEffect, type ReactNode } from "react";
import { observeInputModality } from "./input-modality";
import { initialNavigationLayout } from "./navigation-layout";
import { DocumentScrollbars } from "./scrollbar";

// 初回描画前に切り替え、起動後に本文の幅を動かさない。
// JavaScript無効時や起動失敗時はネイティブのスクロールバーを使う。
const initialScrollbars = `(() => {
  const root = document.documentElement;
  if (!('ResizeObserver' in window) || !CSS.supports('scrollbar-width', 'none')) return;
  root.dataset.animicScrollbars = 'pending';
  setTimeout(() => {
    if (root.dataset.animicScrollbars === 'pending') root.dataset.animicScrollbars = 'fallback';
  }, 8000);
})();`;
export function UIScript() {
  // 同じ計測関数を配信するため、SSRとクライアントのminify表記差だけを比較対象から外す。
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: initialScrollbars + initialNavigationLayout }}
    />
  );
}

/** Portalを含む文書全体の操作方針。 */
export function UIProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stop = observeInputModality(document);
    if (
      document.documentElement.dataset.animicScrollbars !== "fallback" &&
      "ResizeObserver" in window &&
      CSS.supports("scrollbar-width", "none")
    )
      document.documentElement.dataset.animicScrollbars = "ready";
    if (!document.documentElement.id) document.documentElement.id = "animic-document";
    return () => {
      stop();
      delete document.documentElement.dataset.animicScrollbars;
    };
  }, []);
  return (
    <>
      {children}
      <DocumentScrollbars />
    </>
  );
}
