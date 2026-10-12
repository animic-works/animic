import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";

/** 自動移動中は行き先を選択し、手動スクロールでは画面内の位置に追従する。 */
export function useSectionNavigation(ids: readonly string[]) {
  const router = useRouter();
  const [current, setCurrent] = useState(ids[0]);
  const destination = useRef<string | null>(null);
  const navigate = useCallback(
    (id: string) => {
      if (!ids.includes(id)) return;
      const node = document.getElementById(id);
      if (!node) return;
      destination.current = Math.abs(node.getBoundingClientRect().top) < 1 ? null : id;
      setCurrent(id);
      const hash = id === ids[0] ? "" : id;
      if (location.hash.slice(1) !== hash)
        void router.navigate({ to: "/", hash, resetScroll: false, hashScrollIntoView: false });
      node.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    },
    [ids, router],
  );

  useLayoutEffect(() => {
    let frame = 0;
    const visibleSection = () => {
      const middle = innerHeight / 2;
      return ids.find((id) => {
        const box = document.getElementById(id)?.getBoundingClientRect();
        return box && box.top <= middle && box.bottom > middle;
      });
    };
    const read = () => {
      frame = 0;
      if (destination.current) return;
      const section = visibleSection();
      if (section) setCurrent(section);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const finish = () => {
      destination.current = null;
      const id = visibleSection();
      if (!id) return;
      setCurrent(id);
      const hash = id === ids[0] ? "" : id;
      if (location.hash.slice(1) !== hash)
        void router.navigate({
          to: "/",
          hash,
          replace: true,
          resetScroll: false,
          hashScrollIntoView: false,
        });
    };
    const interrupt = (event: Event) => {
      if (
        event instanceof PointerEvent &&
        !(event.target instanceof Element && event.target.closest("[role=scrollbar]"))
      )
        return;
      if (
        event instanceof KeyboardEvent &&
        !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)
      )
        return;
      destination.current = null;
      scroll();
    };
    const restore = () => {
      const id = location.hash.slice(1) || ids[0];
      destination.current = null;
      if (ids.includes(id)) {
        setCurrent(id);
        const node = document.getElementById(id);
        if (node && Math.abs(node.getBoundingClientRect().top) > 1)
          node.scrollIntoView({ behavior: "instant" });
      }
    };
    restore();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("scrollend", finish);
    addEventListener("wheel", interrupt, { passive: true });
    addEventListener("touchstart", interrupt, { passive: true });
    addEventListener("keydown", interrupt, true);
    addEventListener("pointerdown", interrupt);
    addEventListener("popstate", restore);
    addEventListener("hashchange", restore);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", scroll);
      removeEventListener("scrollend", finish);
      removeEventListener("wheel", interrupt);
      removeEventListener("touchstart", interrupt);
      removeEventListener("keydown", interrupt, true);
      removeEventListener("pointerdown", interrupt);
      removeEventListener("popstate", restore);
      removeEventListener("hashchange", restore);
    };
  }, [ids, router]);
  return { current, navigate };
}
