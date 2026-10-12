import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { carousel } from "@animic/styled-system/recipes";
import { IconButton } from "./icon-button";

interface CarouselState {
  id: string;
  count: number;
  index: number;
  from: number;
  change: (index: number) => void;
}
const CarouselContext = createContext<CarouselState | null>(null);
function useCarouselState() {
  const state = useContext(CarouselContext);
  if (!state) throw new Error("Carouselの内側で利用してください。");
  return state;
}

export interface CarouselProps {
  label: string;
  count: number;
  index: number;
  onIndexChange: (index: number) => void;
  children: ReactNode;
}
export function Carousel({ label, count, index, onIndexChange, children }: CarouselProps) {
  const id = useId();
  const total = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  const current =
    total > 0 && Number.isFinite(index) ? ((Math.trunc(index) % total) + total) % total : 0;
  const [motion, setMotion] = useState({ index: current, from: current });
  if (motion.index !== current) setMotion({ index: current, from: motion.index });
  const touch = useRef<{ x: number; y: number } | null>(null);
  const change = (next: number) => {
    if (total > 0) onIndexChange(((next % total) + total) % total);
  };
  const classes = carousel();
  return (
    <CarouselContext.Provider
      value={{ id, count: total, index: current, from: motion.from, change }}
    >
      <div
        role="region"
        aria-roledescription="カルーセル"
        aria-label={label}
        tabIndex={0}
        className={classes.root}
        onKeyDown={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
          )
            return;
          event.preventDefault();
          const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
          change(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? total - 1
                : current + ((event.key === "ArrowRight") !== rtl ? 1 : -1),
          );
        }}
        onTouchStart={(event) => {
          const point = event.touches.length === 1 ? event.touches[0] : undefined;
          touch.current = point ? { x: point.clientX, y: point.clientY } : null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
          const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
          change(current + (dx < 0 !== rtl ? 1 : -1));
        }}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

export function CarouselViewport({
  children,
  preview = false,
  transition = "slide",
}: {
  children: ReactNode;
  preview?: boolean;
  transition?: "slide" | "replace";
}) {
  const state = useCarouselState();
  return (
    <div
      id={state.id}
      className={carousel({ preview, transition }).viewport}
      aria-live="polite"
      aria-atomic="false"
    >
      {children}
    </div>
  );
}

export function CarouselItem({ index, children }: { index: number; children: ReactNode }) {
  const state = useCarouselState();
  const half = Math.floor(state.count / 2);
  const offset =
    state.count > 0 ? ((index - state.index + state.count + half) % state.count) - half : 0;
  const style: CSSProperties & { "--animic-carousel-offset": number } = {
    "--animic-carousel-offset": offset,
  };
  return (
    <div
      role="group"
      aria-roledescription="スライド"
      aria-label={`${index + 1} / ${state.count}`}
      aria-hidden={index !== state.index}
      onClick={() => {
        if (index !== state.index) state.change(index);
      }}
      data-distant={Math.abs(offset) > 1 || undefined}
      data-moving={index === state.index || index === state.from ? "" : undefined}
      className={carousel().item}
      style={style}
    >
      <div inert={index !== state.index}>{children}</div>
    </div>
  );
}

export function CarouselControls({
  itemLabel = "スライド",
  placement = "inline",
}: {
  itemLabel?: string;
  placement?: "inline" | "sides";
}) {
  const state = useCarouselState();
  const classes = carousel({ controls: placement });
  return (
    <div className={classes.controls}>
      <IconButton
        shape="circle"
        size={placement === "inline" ? "sm" : "md"}
        label={`前の${itemLabel}`}
        disabled={state.count < 2}
        onClick={() => state.change(state.index - 1)}
        aria-controls={state.id}
      >
        <svg viewBox="0 0 12 20" aria-hidden="true">
          <path
            d="M10 2 2 10 10 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconButton>
      <div className={classes.indicators}>
        {Array.from({ length: state.count }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1}つ目の${itemLabel}`}
            aria-current={index === state.index ? "true" : undefined}
            aria-controls={state.id}
            onClick={() => state.change(index)}
            className={classes.indicator}
          />
        ))}
      </div>
      <IconButton
        shape="circle"
        size={placement === "inline" ? "sm" : "md"}
        label={`次の${itemLabel}`}
        disabled={state.count < 2}
        onClick={() => state.change(state.index + 1)}
        aria-controls={state.id}
      >
        <svg viewBox="0 0 12 20" aria-hidden="true">
          <path
            d="M2 2 10 10 2 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconButton>
    </div>
  );
}
