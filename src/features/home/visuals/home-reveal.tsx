import { useLayoutEffect, useRef, type ReactNode } from "react";
import { css } from "@animic/styled-system/css";

const reveal = css({
  "&[data-fill]": { height: "[100%]" },
  opacity: 1,
  transform: "none",
  transitionProperty: "[opacity, transform]",
  transitionDuration: "[500ms, 700ms]",
  transitionTimingFunction: "[ease, cubic-bezier(0.2, 0.9, 0.3, 1)]",
  transitionDelay: "[150ms]",
  "&[data-order='1']": { transitionDelay: "[230ms]" },
  "&[data-order='2']": { transitionDelay: "[310ms]" },
  "&[data-order='3']": { transitionDelay: "[390ms]" },
  "&[data-order='4']": { transitionDelay: "[470ms]" },
  "&[data-reveal-pending]": {
    opacity: 0,
    transform: "translateY(2rem)",
    transitionDuration: "[0ms]",
    transitionDelay: "[0ms]",
    _motionReduce: { opacity: 1, transform: "none" },
  },
  _motionReduce: {
    opacity: 1,
    transform: "none",
    transitionDuration: "[0ms]",
    transitionDelay: "[0ms]",
  },
});

export function HomeReveal({
  children,
  order = 0,
  fill = false,
}: {
  fill?: boolean;
  children: ReactNode;
  order?: 0 | 1 | 2 | 3 | 4;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    const section = node?.closest("section");
    if (!node || !section) return undefined;
    // 初期表示・復帰先はSSRの表示を保ち、これから入る区画だけを演出する。
    if (section.getBoundingClientRect().top < innerHeight) return undefined;
    node.setAttribute("data-reveal-pending", "");
    function update() {
      if (section && node && section.getBoundingClientRect().top < innerHeight * 0.85) {
        node.removeAttribute("data-reveal-pending");
        removeEventListener("scroll", update);
        removeEventListener("resize", update);
      }
    }
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
      node.removeAttribute("data-reveal-pending");
    };
  }, []);
  return (
    <div ref={ref} className={reveal} data-order={order} data-fill={fill || undefined}>
      {children}
    </div>
  );
}
