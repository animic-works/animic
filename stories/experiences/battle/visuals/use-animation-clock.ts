import { useLayoutEffect, useRef } from "react";

/** CSS owns the frames; the presentation clock owns playback, including speed changes. */
export function useAnimationClock<T extends HTMLElement | SVGElement>(elapsed: number) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    for (const animation of ref.current?.getAnimations({ subtree: true }) ?? []) {
      // State transitions keep their native duration when the playback speed changes.
      if (!("animationName" in animation)) continue;
      animation.pause();
      animation.currentTime = Math.max(0, elapsed);
    }
  }, [elapsed]);
  return ref;
}
