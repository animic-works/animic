import { backLink, docPage, mobileBar, pageDeco } from "@animic/styled-system/recipes";
import type { MobileBarVariantProps } from "@animic/styled-system/recipes";
import type { ReactNode } from "react";

import { Icon, IconButton } from "../icon/icon";

export type MobileBarProps = MobileBarVariantProps & {
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
  variant,
  backHref,
  onBack,
  backLabel,
  logoSrc,
  title,
}: MobileBarProps) {
  const classes = mobileBar({ variant });
  const chevron = <Icon name="chevronLeft" size="xs" />;
  return (
    <header className={classes.root}>
      {backHref ? (
        <a className={classes.back} href={backHref} aria-label={backLabel} onClick={onBack}>
          {chevron}
        </a>
      ) : (
        <button type="button" className={classes.back} aria-label={backLabel} onClick={onBack}>
          {chevron}
        </button>
      )}
      {logoSrc ? (
        <img className={classes.logo} src={logoSrc} alt="" width="2078" height="607" />
      ) : null}
      {title ? <p className={classes.title}>{title}</p> : null}
    </header>
  );
}

// 画面の背景に置く飾り（固定）。斜めの短い線と網点
export function PageDeco({ variant }: { variant: "entry" | "terms" | "privacy" }) {
  const className = pageDeco();
  if (variant === "entry") {
    return (
      <svg
        className={className}
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="page-deco-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="#c3c8d0" />
          </pattern>
        </defs>
        <rect x="0" y="80" width="130" height="190" fill="url(#page-deco-dots)" opacity="0.8" />
        <rect x="1440" y="600" width="140" height="160" fill="url(#page-deco-dots)" opacity="0.8" />
        <path d="M0 180 L90 100 L100 104 L6 190 Z" fill="#ff72b9" />
        <path d="M1380 120 L1470 40 L1476 44 L1386 124 Z" fill="#00b4fc" />
        <path d="M1440 170 L1500 130 L1504 134 L1446 176 Z" fill="#fddb13" />
        <path d="M1150 900 L1250 810 L1250 840 L1180 900 Z" fill="#ff72b9" />
        <path d="M420 860 L480 810 L482 840 Z" fill="#00b4fc" />
        <path d="M1180 300 L1220 280 L1205 330 Z" fill="#ff72b9" />
        <path d="M1215 360 L1235 340 L1250 372 Z" fill="#00b4fc" />
        <g stroke="#c3c8d0" strokeWidth="2">
          <path d="M1320 460 v30 M1305 475 h30" />
          <path d="M260 420 v36 M242 438 h36" />
        </g>
        <g stroke="#cfd4db" strokeWidth="1.5">
          <line x1="1480" y1="330" x2="1600" y2="240" />
          <line x1="180" y1="640" x2="260" y2="580" />
        </g>
      </svg>
    );
  }
  const [a, b] = variant === "terms" ? ["#ff72b9", "#00b4fc"] : ["#00b4fc", "#ff72b9"];
  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path d="M0 180 L90 100 L100 104 L6 190 Z" fill={a} />
      <path d="M1380 120 L1470 40 L1476 44 L1386 124 Z" fill={b} />
      <path d="M1440 170 L1500 130 L1504 134 L1446 176 Z" fill="#fddb13" />
      <path d="M1150 900 L1250 810 L1250 840 L1180 900 Z" fill={a} />
    </svg>
  );
}

export type BackLinkProps = { href?: string; onClick?: () => void; children: ReactNode };

// 左上の「戻る」。href があればリンク、なければボタン
export function BackLink({ href, onClick, children }: BackLinkProps) {
  const className = backLink();
  const content = (
    <>
      <Icon name="chevronLeft" size="2xs" />
      {children}
    </>
  );
  return href ? (
    <a className={className} href={href} onClick={onClick}>
      {content}
    </a>
  ) : (
    <button type="button" className={className} onClick={onClick}>
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
  const classes = docPage();
  return (
    <>
      <MobileBar variant="sticky" backLabel="戻る" title={title} onBack={onBack} />
      <main className={classes.page} id="top">
        <article className={classes.doc}>
          <header className={classes.head}>
            <p className={classes.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={classes.meta}>{meta}</p>
          </header>
          {draftNote ? <p className={classes.draft}>{draftNote}</p> : null}
          <details className={classes.toc} open>
            <summary className={classes.tocSummary}>目次</summary>
            <ol className={classes.tocList}>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.shortTitle ?? section.title}</a>
                </li>
              ))}
            </ol>
          </details>
          {intro}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className={classes.section}>
              <h2 className={classes.heading}>{section.title}</h2>
              {section.body}
            </section>
          ))}
          <footer className={classes.foot}>
            <a href={footLink.href}>{footLink.label}</a>
            <span>{footNote}</span>
          </footer>
        </article>
      </main>
      <span className={classes.toTop} hidden={!showToTop}>
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
  return <p className={docPage().paragraph}>{children}</p>;
}

export function DocList({ ordered = false, items }: { ordered?: boolean; items: ReactNode[] }) {
  const Element = ordered ? "ol" : "ul";
  return (
    <Element className={docPage().list}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Element>
  );
}

export function DocTable({ rows }: { rows: [string, ReactNode][] }) {
  const classes = docPage();
  return (
    <div className={classes.tableWrap}>
      <table className={classes.table}>
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
