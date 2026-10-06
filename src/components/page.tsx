import type { ReactNode } from "react";

import { variant } from "./cx";
import { Icon, IconButton } from "./icon";
import backLinkStyles from "./back-link.module.css";
import docPageStyles from "./doc-page.module.css";
import mobileBarStyles from "./mobile-bar.module.css";
import pageDecoStyles from "./page-deco.module.css";

export type MobileBarProps = {
  variant?: "float" | "sticky";
  /** 戻るの行き先。href があればリンク、なければボタン */
  backHref?: string;
  onBack?: () => void;
  backLabel: string;
  /** 中央に置くロゴ（ログイン）か見出し（文書） */
  logoSrc?: string;
  title?: string;
};

// スマホの上のアプリバー: 左に戻る、中央にロゴか見出し。広い画面では出さない
export function MobileBar({
  variant: barVariant = "sticky",
  backHref,
  onBack,
  backLabel,
  logoSrc,
  title,
}: MobileBarProps) {
  const backClass = variant(mobileBarStyles, "back", { variant: barVariant });
  const chevron = <Icon name="chevronLeft" size="xs" />;
  return (
    <header className={variant(mobileBarStyles, "root", { variant: barVariant })}>
      {backHref ? (
        <a className={backClass} href={backHref} aria-label={backLabel} onClick={onBack}>
          {chevron}
        </a>
      ) : (
        <button type="button" className={backClass} aria-label={backLabel} onClick={onBack}>
          {chevron}
        </button>
      )}
      {logoSrc ? (
        <img className={mobileBarStyles.logo} src={logoSrc} alt="" width="2078" height="607" />
      ) : null}
      {title ? <p className={mobileBarStyles.title}>{title}</p> : null}
    </header>
  );
}

// 飾りの色（トークンのCSS変数）
const decoColor = {
  pink: "var(--colors-accent-muted)",
  cyan: "var(--colors-info-default)",
  yellow: "var(--colors-warning-default)",
  dot: "var(--colors-deco-dot)",
  line: "var(--colors-deco-line)",
};

// 画面の背景に置く飾り（固定）。どの画面にも4本の斜めの線を置き、ログインなど（entry）は網点も足す
export function PageDeco({ variant: decoVariant }: { variant: "entry" | "terms" | "privacy" }) {
  // 左上と右上の線の色（下の線は左上と同じ）
  const [a, b] =
    decoVariant === "privacy" ? [decoColor.cyan, decoColor.pink] : [decoColor.pink, decoColor.cyan];
  return (
    <svg
      className={pageDecoStyles.root}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {decoVariant === "entry" ? (
        <>
          <defs>
            <pattern id="page-deco-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill={decoColor.dot} />
            </pattern>
          </defs>
          <rect x="0" y="80" width="130" height="190" fill="url(#page-deco-dots)" opacity="0.8" />
          <rect
            x="1440"
            y="600"
            width="140"
            height="160"
            fill="url(#page-deco-dots)"
            opacity="0.8"
          />
        </>
      ) : null}
      <path d="M0 180 L90 100 L100 104 L6 190 Z" fill={a} />
      <path d="M1380 120 L1470 40 L1476 44 L1386 124 Z" fill={b} />
      <path d="M1440 170 L1500 130 L1504 134 L1446 176 Z" fill={decoColor.yellow} />
      <path d="M1150 900 L1250 810 L1250 840 L1180 900 Z" fill={a} />
      {decoVariant === "entry" ? (
        <>
          <path d="M420 860 L480 810 L482 840 Z" fill={decoColor.cyan} />
          <path d="M1180 300 L1220 280 L1205 330 Z" fill={decoColor.pink} />
          <path d="M1215 360 L1235 340 L1250 372 Z" fill={decoColor.cyan} />
          <g stroke={decoColor.dot} strokeWidth="2">
            <path d="M1320 460 v30 M1305 475 h30" />
            <path d="M260 420 v36 M242 438 h36" />
          </g>
          <g stroke={decoColor.line} strokeWidth="1.5">
            <line x1="1480" y1="330" x2="1600" y2="240" />
            <line x1="180" y1="640" x2="260" y2="580" />
          </g>
        </>
      ) : null}
    </svg>
  );
}

export type BackLinkProps = { href?: string; onClick?: () => void; children: ReactNode };

// 左上の「戻る」。href があればリンク、なければボタン
export function BackLink({ href, onClick, children }: BackLinkProps) {
  const content = (
    <>
      <Icon name="chevronLeft" size="2xs" />
      {children}
    </>
  );
  return href ? (
    <a className={backLinkStyles.root} href={href} onClick={onClick}>
      {content}
    </a>
  ) : (
    <button type="button" className={backLinkStyles.root} onClick={onClick}>
      {content}
    </button>
  );
}

export type DocSection = {
  id: string;
  title: string;
  /** 目次に出す短い題（省くと見出しと同じ） */
  shortTitle?: string;
  body: ReactNode;
};

export type DocPageProps = {
  eyebrow: string;
  title: string;
  meta: string;
  /** 文面が確定するまで、目次と前文の前に出す注記 */
  draftNote?: string;
  intro: ReactNode;
  sections: DocSection[];
  footLink: { href: string; label: string };
  footNote: string;
  /** ページの先頭へ戻るボタンを出すか（スクロール位置に応じて呼び出し側が決める） */
  showToTop: boolean;
  onToTop: () => void;
  /** スマホの上のバーの「戻る」 */
  onBack: () => void;
};

// 規約・ポリシーなどの文書ページ
export function DocPage({
  eyebrow,
  title,
  meta,
  draftNote,
  intro,
  sections,
  footLink,
  footNote,
  showToTop,
  onToTop,
  onBack,
}: DocPageProps) {
  return (
    <>
      <MobileBar variant="sticky" backLabel="戻る" title={title} onBack={onBack} />
      <main className={docPageStyles.page} id="top">
        <article className={docPageStyles.doc}>
          <header className={docPageStyles.head}>
            <p className={docPageStyles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={docPageStyles.meta}>{meta}</p>
          </header>
          {draftNote ? <p className={docPageStyles.draft}>{draftNote}</p> : null}
          <details className={docPageStyles.toc} open>
            <summary className={docPageStyles.tocSummary}>目次</summary>
            <ol className={docPageStyles.tocList}>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.shortTitle ?? section.title}</a>
                </li>
              ))}
            </ol>
          </details>
          {intro}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className={docPageStyles.section}>
              <h2 className={docPageStyles.heading}>{section.title}</h2>
              {section.body}
            </section>
          ))}
          <footer className={docPageStyles.foot}>
            <a href={footLink.href}>{footLink.label}</a>
            <span>{footNote}</span>
          </footer>
        </article>
      </main>
      <span className={docPageStyles.toTop} hidden={!showToTop}>
        <IconButton
          variant="float"
          label="ページの先頭へ"
          icon="chevronUp"
          iconSize="sm"
          onClick={onToTop}
        />
      </span>
    </>
  );
}

// 文書の本文の要素（段落・箇条書き・表）
export function DocParagraph({ children }: { children: ReactNode }) {
  return <p className={docPageStyles.paragraph}>{children}</p>;
}

export function DocList({ ordered = false, items }: { ordered?: boolean; items: ReactNode[] }) {
  const Element = ordered ? "ol" : "ul";
  return (
    <Element className={docPageStyles.list}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Element>
  );
}

export function DocTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className={docPageStyles.tableWrap}>
      <table className={docPageStyles.table}>
        <tbody>
          {rows.map(([head, body]) => (
            <tr key={head}>
              <th scope="row">{head}</th>
              <td>{body}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
