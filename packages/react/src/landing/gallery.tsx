import { cx } from "@animic/styled-system/css";
import { gallery, landingScreen, siteFooter, stepCarousel } from "@animic/styled-system/recipes";
import type { GalleryVariantProps } from "@animic/styled-system/recipes";
import { useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, Ref, TouchEvent } from "react";

import { Icon, IconButton } from "../icon/icon";

export type GalleryMatch = {
  level: string;
  /** お題の条件（例: 背景なし・1キャラクター） */
  rule: string;
  /** 再現度（0〜100） */
  similarity: number;
  /** お題と提出画像の地の色 */
  tints: [GalleryVariantProps["tint"], GalleryVariantProps["tint"]];
};

/** 外から（左右キーなど）対戦を送るための操作 */
export type GalleryHandle = { slide: (dir: number) => void };

export type GalleryCarouselProps = {
  matches: GalleryMatch[];
  /** 見出し（SectionHead） */
  head: ReactNode;
  ref?: Ref<GalleryHandle>;
};

export function GallerySection({ children }: { children: ReactNode }) {
  const classes = gallery();
  return <div className={classes.section}>{children}</div>;
}

// 対戦を1つずつ、お題と提出画像を並べて見せる（左右のボタン・ドット・左右キー・横スワイプで切り替え）。
// 左: 見出し → いま見ている対戦の情報と左右のボタン / 右: お題と提出画像を大きく並べる
export function GalleryCarousel({ matches, head, ref }: GalleryCarouselProps) {
  const classes = gallery();
  const dots = stepCarousel();
  const total = matches.length;
  const [index, setIndex] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const show = (next: number) => setIndex(((next % total) + total) % total);
  const slide = (dir: number) => show(index + dir);
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

  const match = matches[index] ?? matches[0];
  const percent = Math.max(0, Math.min(100, match?.similarity ?? 0));
  const reveal = landingScreen({ delay: "1" }).reveal;
  return (
    <div
      className={classes.body}
      role="region"
      aria-roledescription="カルーセル"
      aria-label="みんなの対戦"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={classes.head}>{head}</div>
      <div className={cx(classes.card, reveal)}>
        <div className={classes.top}>
          <p className={classes.number}>
            <b>{index + 1}</b>
            <small className={classes.numberTotal}>/ {total}</small>
          </p>
          <div className={classes.controls}>
            <IconButton
              variant="soft"
              label="前の対戦"
              icon="arrowLeft"
              onClick={() => slide(-1)}
            />
            <ol className={dots.dots} aria-label="対戦">
              {matches.map((item, i) => (
                <li key={`${item.level}-${item.rule}-${item.similarity}`}>
                  <button
                    type="button"
                    className={dots.dot}
                    aria-label={`${i + 1}つ目の対戦`}
                    aria-current={i === index ? "true" : "false"}
                    onClick={() => show(i)}
                  />
                </li>
              ))}
            </ol>
            <IconButton
              variant="soft"
              label="次の対戦"
              icon="arrowRight"
              onClick={() => slide(1)}
            />
          </div>
        </div>
        <div className={classes.info} aria-live="polite">
          <p className={classes.tags}>
            <span className={classes.level}>{match?.level}</span>
          </p>
          <h3 className={classes.title}>{match?.rule}</h3>
        </div>
        <div className={classes.score}>
          <div className={classes.row}>
            <span>再現度</span>
            <b className={classes.value}>
              {percent}
              <small>%</small>
            </b>
          </div>
          <div className={classes.meter} aria-hidden="true">
            <span className={classes.meterBar} style={{ "--meter": `${percent}%` }} />
          </div>
        </div>
      </div>
      <div className={cx(classes.viewer, reveal)}>
        {(["お題", "提出"] as const).map((caption, i) => (
          <figure key={caption} className={gallery({ tint: match?.tints[i] }).shot}>
            <Icon name="image" size="5xl" />
            <figcaption className={classes.shotCaption}>{caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export type SiteFooterProps = {
  logoSrc: string;
  links: { href: string; label: string }[];
  copyright: string;
};

// フッター: ロゴ・規約へのリンク・著作権表示
export function SiteFooter({ logoSrc, links, copyright }: SiteFooterProps) {
  const classes = siteFooter();
  return (
    <footer className={classes.root}>
      <img className={classes.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
      <nav className={classes.legal} aria-label="規約">
        {links.map((link) => (
          <a key={link.href} className={classes.link} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <small className={classes.copyright}>{copyright}</small>
    </footer>
  );
}
