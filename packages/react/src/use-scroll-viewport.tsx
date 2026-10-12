import { useCallback, useId, useState, type Ref } from "react";
import { Scrollbars } from "./scrollbar";

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") return ref(node);
  if (ref) ref.current = node;
  return undefined;
}

/** スクロール要素を明示的に登録し、既存のDOMと寸法・操作を維持する。 */
export function useScrollViewport<T extends HTMLElement>(
  label: string,
  forwardedRef?: Ref<T>,
  revision?: string,
) {
  const id = useId();
  const [viewport, setViewport] = useState<T | null>(null);
  const ref = useCallback(
    (node: T | null) => {
      if (node && !node.id) node.id = id;
      setViewport(node);
      return assignRef(forwardedRef, node);
    },
    [id, forwardedRef],
  );
  return { ref, scrollbars: <Scrollbars viewport={viewport} label={label} revision={revision} /> };
}
