import { useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, Ref, TouchEvent } from "react";

import { cx, variant } from "../../components/cx";
import { Icon, IconButton } from "../../components/icon";
import type { IconName } from "../../components/icon";
import landingScreenStyles from "./landing-screen.module.css";
import stepCarouselStyles from "./step-carousel.module.css";

type StepTint = "cyan" | "pink" | "yellow";

export type Step = {
  title: string;
  description: string;
  /** 挿絵の画像（アプリの public/ に置く）。なければ icon を傾けた白い札に置く */
  image?: { src: string; width: number; height: number };
  icon?: IconName;
  tint: StepTint;
};

/** 外から（左右キーなど）カードを送るための操作 */
export type StepCarouselHandle = { slide: (dir: number) => void };

export type StepCarouselProps = {
  steps: Step[];
  /** 見出し（SectionHead） */
  head: ReactNode;
  titleId: string;
  ref?: Ref<StepCarouselHandle>;
};

// 中央からの位置（-2〜2）を変種の名前にする
const OFFSET_KEYS = ["-2", "-1", "0", "1", "2"] as const;

// 中央からの位置（-1: 左、0: 中央、1: 右）。はみ出す1枚は、進んだ方向と逆側に置く
function offsetsOf(total: number, active: number, dir: number) {
  return Array.from({ length: total }, (_, i) => {
    let offset = (((i - active) % total) + total) % total;
    if (offset > total / 2 || (offset === total / 2 && dir > 0)) offset -= total;
    return offset;
  });
}

// 中央のカードを大きく見せ、前後のカードを左右に少しのぞかせる。
// カードは左右のボタン・ドット・左右キー・横スワイプで切り替える
export function StepCarousel({ steps, head, titleId, ref }: StepCarouselProps) {
  const total = steps.length;
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  // 反対側へ回り込むカード。画面を横切らないよう、位置を瞬時に移す
  const [wrapped, setWrapped] = useState<ReadonlySet<number>>(new Set());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const offsets = offsetsOf(total, active, dir);

  function slideTo(index: number, forced?: number) {
    const next = ((index % total) + total) % total;
    if (next === active) return;
    const nextDir = forced ?? (next > active ? 1 : -1);
    const after = offsetsOf(total, next, nextDir);
    const wrap = new Set(
      offsets.flatMap((offset, i) => (Math.abs((after[i] ?? 0) - offset) > 1 ? [i] : [])),
    );
    setDir(nextDir);
    setActive(next);
    setWrapped(wrap);
    if (wrap.size) requestAnimationFrame(() => setWrapped(new Set()));
  }
  const slide = (step: number) => slideTo(active + step, step);
  useImperativeHandle(ref, () => ({ slide }));

  function onTouchStart(event: TouchEvent) {
    const point = event.touches[0];
    touch.current = point ? { x: point.clientX, y: point.clientY } : null;
  }
  function onTouchEnd(event: TouchEvent) {
    const point = event.changedTouches[0];
    if (!touch.current || !point) return;
    const dx = touch.current.x - point.clientX;
    const dy = touch.current.y - point.clientY;
    touch.current = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 40) slide(Math.sign(dx));
  }

  return (
    <>
      <div className={stepCarouselStyles.head}>{head}</div>
      <div
        className={cx(
          stepCarouselStyles.carousel,
          variant(landingScreenStyles, "reveal", { delay: "1" }),
        )}
        role="region"
        aria-roledescription="カルーセル"
        aria-labelledby={titleId}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ol className={stepCarouselStyles.steps}>
          {steps.map((step, i) => {
            const offset = Math.max(-2, Math.min(2, offsets[i] ?? 0));
            const current = offset === 0;
            const offsetKey = OFFSET_KEYS[offset + 2];
            return (
              <li
                key={step.title}
                className={variant(stepCarouselStyles, "step", {
                  tint: step.tint,
                  offset: offsetKey,
                })}
                aria-label={`ステップ${i + 1}: ${step.title}`}
                aria-hidden={current ? undefined : "true"}
                data-active={current || undefined}
                data-wrap={wrapped.has(i) || undefined}
                data-picture={step.image ? "" : undefined}
                onClick={() => {
                  if (!current) slide(offset < 0 ? -1 : 1);
                }}
              >
                <div className={stepCarouselStyles.body}>
                  <span className={stepCarouselStyles.number}>
                    {i + 1}
                    <small className={stepCarouselStyles.numberTotal}>/ {total}</small>
                  </span>
                  <h3 className={stepCarouselStyles.title}>{step.title}</h3>
                  <p className={stepCarouselStyles.description}>{step.description}</p>
                </div>
                <div
                  className={variant(stepCarouselStyles, "visual", {
                    tint: step.tint,
                    offset: offsetKey,
                  })}
                  aria-hidden="true"
                >
                  {step.image ? (
                    <div className={stepCarouselStyles.pic}>
                      <img
                        src={step.image.src}
                        alt=""
                        width={step.image.width}
                        height={step.image.height}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className={stepCarouselStyles.picNumber}>
                        {i + 1}
                        <small>/ {total}</small>
                      </span>
                    </div>
                  ) : (
                    <Icon name={step.icon ?? "image"} size="lg" />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <div className={stepCarouselStyles.controls}>
          <span data-part="arrow" data-direction="prev">
            <IconButton
              variant="soft"
              label="前の手順"
              icon="arrowLeft"
              onClick={() => slide(-1)}
            />
          </span>
          <ol className={stepCarouselStyles.dots} aria-label="手順">
            {steps.map((step, i) => (
              <li key={step.title}>
                <button
                  type="button"
                  className={stepCarouselStyles.dot}
                  aria-label={`ステップ${i + 1}: ${step.title}`}
                  aria-current={i === active ? "true" : "false"}
                  onClick={() => slideTo(i)}
                />
              </li>
            ))}
          </ol>
          <span data-part="arrow" data-direction="next">
            <IconButton
              variant="soft"
              label="次の手順"
              icon="arrowRight"
              onClick={() => slide(1)}
            />
          </span>
        </div>
      </div>
    </>
  );
}

// 遊び方の画面の外枠（斜めに切った白い帯）
export function StepSection({ children }: { children: ReactNode }) {
  return <div className={stepCarouselStyles.section}>{children}</div>;
}
