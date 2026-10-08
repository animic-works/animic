import { useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, Ref, TouchEvent } from "react";

import { cx, variant } from "../../components/cx";
import { Icon, IconButton } from "../../components/icon";
import galleryStyles from "./gallery.module.css";
import landingScreenStyles from "./landing-screen.module.css";
import siteFooterStyles from "./site-footer.module.css";
import stepCarouselStyles from "./step-carousel.module.css";

type GalleryTint = "cyan" | "pink" | "yellow" | "green" | "purple";

export type GalleryMatch = {
  level: string;
  /** お題の条件（例: 背景なし・1キャラクター） */
  rule: string;
  /** 再現度（0〜100） */
  similarity: number;
  /** お題と提出画像の地の色 */
  tints: [GalleryTint, GalleryTint];
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
  return <div className={galleryStyles.section}>{children}</div>;
}

// 対戦を1つずつ、お題と提出画像を並べて見せる（左右のボタン・ドット・左右キー・横スワイプで切り替え）。
// 左: 見出し → いま見ている対戦の情報と左右のボタン / 右: お題と提出画像を大きく並べる
export function GalleryCarousel({ matches, head, ref }: GalleryCarouselProps) {
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
  const reveal = variant(landingScreenStyles, "reveal", { delay: "1" });
  return (
    <div
      className={galleryStyles.body}
      role="region"
      aria-roledescription="カルーセル"
      aria-label="みんなの対戦"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={galleryStyles.head}>{head}</div>
      <div className={cx(galleryStyles.card, reveal)}>
        <div className={galleryStyles.top}>
          <p className={galleryStyles.number}>
            <b>{index + 1}</b>
            <small className={galleryStyles.numberTotal}>/ {total}</small>
          </p>
          <div className={galleryStyles.controls}>
            <IconButton
              variant="soft"
              label="前の対戦"
              icon="arrowLeft"
              onClick={() => slide(-1)}
            />
            <ol className={stepCarouselStyles.dots} aria-label="対戦">
              {matches.map((item, i) => (
                <li key={`${item.level}-${item.rule}-${item.similarity}`}>
                  <button
                    type="button"
                    className={stepCarouselStyles.dot}
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
        <div className={galleryStyles.info} aria-live="polite">
          <p className={galleryStyles.tags}>
            <span className={galleryStyles.level}>{match?.level}</span>
          </p>
          <h3 className={galleryStyles.title}>{match?.rule}</h3>
        </div>
        <div className={galleryStyles.score}>
          <div className={galleryStyles.row}>
            <span>再現度</span>
            <b className={galleryStyles.value}>
              {percent}
              <small>%</small>
            </b>
          </div>
          <div className={galleryStyles.meter} aria-hidden="true">
            <span className={galleryStyles.meterBar} style={{ "--meter": `${percent}%` }} />
          </div>
        </div>
      </div>
      <div className={cx(galleryStyles.viewer, reveal)}>
        {(["お題", "提出"] as const).map((caption, i) => (
          <figure
            key={caption}
            className={variant(galleryStyles, "shot", { tint: match?.tints[i] })}
          >
            <Icon name="image" size="5xl" />
            <figcaption className={galleryStyles.shotCaption}>{caption}</figcaption>
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
  return (
    <footer className={siteFooterStyles.root}>
      <img className={siteFooterStyles.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
      <nav className={siteFooterStyles.legal} aria-label="規約">
        {links.map((link) => (
          <a key={link.href} className={siteFooterStyles.link} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <small className={siteFooterStyles.copyright}>{copyright}</small>
    </footer>
  );
}
