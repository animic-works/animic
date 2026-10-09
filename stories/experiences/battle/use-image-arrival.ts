import { useEffect, useRef, useState } from "react";
import type { GeneratedImage } from "./battle-presentation";

export function useImageArrival(images: readonly GeneratedImage[]) {
  const previous = useRef(
    new Set(images.filter((image) => image.status === "ready").map((image) => image.id)),
  );
  const [arrival, setArrival] = useState<number | null>(null);
  useEffect(() => {
    const ready = images.filter((image) => image.status === "ready");
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
