import { useEffect, useRef, useState } from "react";
import type { BattleSnapshot } from "./battle-state";

type Generation = BattleSnapshot["myGenerations"][number];

/** 新しく完成した画像のIDを、到着の演出を見せる1秒間だけ返す。 */
export function useImageArrival(images: readonly Generation[]) {
  const previous = useRef(
    new Set(images.filter((image) => image.status === "succeeded").map((image) => image.id)),
  );
  const [arrival, setArrival] = useState<string | null>(null);
  useEffect(() => {
    const ready = images.filter((image) => image.status === "succeeded");
    const added = ready.findLast((image) => !previous.current.has(image.id));
    previous.current = new Set(ready.map((image) => image.id));
    if (added) setArrival(added.id);
  }, [images]);
  useEffect(() => {
    if (arrival === null) return undefined;
    const timer = setTimeout(() => setArrival(null), 1000);
    return () => clearTimeout(timer);
  }, [arrival]);
  return arrival;
}
