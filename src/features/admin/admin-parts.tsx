import type { MouseEvent, ReactNode } from "react";

import { variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import type { IconName } from "../../components/icon";
import adminColumnsStyles from "./admin-columns.module.css";
import adminGuideStyles from "./admin-guide.module.css";
import adminHeadStyles from "./admin-head.module.css";
import adminShellStyles from "./admin-shell.module.css";
import filterBarStyles from "./filter-bar.module.css";
import infoListStyles from "./info-list.module.css";
import summaryTilesStyles from "./summary-tiles.module.css";
import topicTileStyles from "./topic-tile.module.css";

// 管理画面の部品。画面の枠・見出し・お題の一覧・2列の配置・案内

export type AdminNavItem = {
  href: string;
  label: string;
  icon: IconName;
  current?: boolean;
};

export type AdminShellProps = {
  logoSrc: string;
  logoHref: string;
  /** 「管理」の札（Badge）など、ロゴの右に置くもの */
  badge: ReactNode;
  /** 右端の操作（ログアウト） */
  end: ReactNode;
  nav: AdminNavItem[];
  /** ナビのリンクを押したとき（画面の移動をルーターに任せる） */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
};

// 管理画面の枠: 上のバー、左の縦のナビ、右の中身。860px未満ではナビを横に並べて1列にする
export function AdminShell({
  logoSrc,
  logoHref,
  badge,
  end,
  nav,
  onNavigate,
  children,
}: AdminShellProps) {
  return (
    <div className={adminShellStyles.root}>
      <header className={adminShellStyles.bar}>
        <a href={logoHref}>
          <img
            className={adminShellStyles.logo}
            src={logoSrc}
            alt="Animic トップ"
            width="2078"
            height="607"
          />
        </a>
        <div className={adminShellStyles.barSide}>{badge}</div>
        <div className={adminShellStyles.barEnd}>{end}</div>
      </header>
      <div className={adminShellStyles.body}>
        <nav className={adminShellStyles.nav} aria-label="管理メニュー">
          <span className={adminShellStyles.navTitle} aria-hidden="true">
            Admin
          </span>
          <ul className={adminShellStyles.navList}>
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  className={adminShellStyles.navLink}
                  href={item.href}
                  aria-current={item.current ? "page" : undefined}
                  onClick={(event) => onNavigate?.(item.href, event)}
                >
                  <span className={adminShellStyles.navIcon} aria-hidden="true">
                    <Icon name={item.icon} size="md" />
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <main className={adminShellStyles.main}>{children}</main>
      </div>
    </div>
  );
}

type AdminCrumb = { label: string; href?: string };

export type AdminHeadProps = {
  /** パンくず（最後が今の画面） */
  crumbs?: AdminCrumb[];
  onCrumbClick?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  eyebrow: string;
  title: string;
  /** 題の右に並べる札（状態・難易度） */
  titleAside?: ReactNode;
  description?: ReactNode;
  /** 右端の操作。主な操作（primary）は1つだけ */
  actions?: ReactNode;
};

// 画面の見出しの行
export function AdminHead({
  crumbs,
  onCrumbClick,
  eyebrow,
  title,
  titleAside,
  description,
  actions,
}: AdminHeadProps) {
  return (
    <header className={adminHeadStyles.root}>
      <div className={adminHeadStyles.text}>
        {crumbs?.length ? (
          <nav aria-label="パンくず">
            <ol className={adminHeadStyles.crumbs}>
              {crumbs.map((crumb, index) => (
                <li key={crumb.label} className={adminHeadStyles.crumb}>
                  {crumb.href && index < crumbs.length - 1 ? (
                    <a
                      href={crumb.href}
                      onClick={(event) => (crumb.href ? onCrumbClick?.(crumb.href, event) : null)}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <span className={adminHeadStyles.eyebrow} aria-hidden="true">
          {eyebrow}
        </span>
        <h1 className={adminHeadStyles.title}>
          {title}
          {titleAside ? <span className={adminHeadStyles.aside}>{titleAside}</span> : null}
        </h1>
      </div>
      {actions ? <div className={adminHeadStyles.actions}>{actions}</div> : null}
      {description ? <p className={adminHeadStyles.description}>{description}</p> : null}
    </header>
  );
}

export type SummaryTile = { label: string; count: number; goal: number };

// 難易度ごとの公開中の数と目安
export function SummaryTiles({ label, items }: { label: string; items: SummaryTile[] }) {
  return (
    <ul className={summaryTilesStyles.root} aria-label={label}>
      {items.map((item) => {
        const ratio = item.goal > 0 ? Math.min(1, item.count / item.goal) : 0;
        return (
          <li key={item.label} className={summaryTilesStyles.tile}>
            <span className={summaryTilesStyles.head}>
              <span className={summaryTilesStyles.label}>{item.label}</span>
              <span className={summaryTilesStyles.ratio}>{Math.round(ratio * 100)}%</span>
            </span>
            <p className={summaryTilesStyles.count}>
              公開中
              <b className={summaryTilesStyles.number}>{item.count}</b>
              <span className={summaryTilesStyles.goal}>/ 目安 {item.goal}</span>
            </p>
            <span className={summaryTilesStyles.meter} aria-hidden="true">
              <span className={summaryTilesStyles.fill} style={{ "--meter": ratio }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// 絞り込みの行
export function FilterBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={filterBarStyles.root} role="search" aria-label={label}>
      {children}
    </div>
  );
}

// 絞り込みの1項目（項目名と選択）
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={filterBarStyles.group}>
      <span className={filterBarStyles.label} aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}

// 一覧の件数と並び順
export function ListSummary({ count, order }: { count: ReactNode; order: ReactNode }) {
  return (
    <p className={filterBarStyles.summary}>
      <span role="status">{count}</span>
      <span className={filterBarStyles.summaryEnd}>{order}</span>
    </p>
  );
}

// お題のタイルを並べる
export function TopicGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul className={topicTileStyles.grid} aria-label={label}>
      {children}
    </ul>
  );
}

export type TopicTileProps = {
  href: string;
  onOpen?: (event: MouseEvent<HTMLAnchorElement>) => void;
  imageSrc: string;
  /** 題名。なければIDを等幅で出す（fallbackTitle） */
  title: string;
  fallbackTitle: string;
  /** 左上の状態の札と、右上の難易度の札 */
  status: ReactNode;
  difficulty: ReactNode;
  /** 題名の下の短い説明（「非公開・かんたん」など） */
  meta: string;
  /** 更新日（「10/04」など）と、その機械向けの日時。日時が不明なら dateTime を省き、date に「—」を渡す */
  date: string;
  dateTime?: string;
};

// お題の1枚。タイル全体が詳細へのリンク
export function TopicTile({
  href,
  onOpen,
  imageSrc,
  title,
  fallbackTitle,
  status,
  difficulty,
  meta,
  date,
  dateTime,
}: TopicTileProps) {
  const name = title || fallbackTitle;
  return (
    <li className={topicTileStyles.root}>
      <a
        className={topicTileStyles.link}
        href={href}
        onClick={onOpen}
        aria-label={`${name}の詳細`}
      />
      <figure className={topicTileStyles.figure}>
        <img className={topicTileStyles.image} src={imageSrc} alt="" loading="lazy" />
      </figure>
      <div className={topicTileStyles.top}>
        <span className={topicTileStyles.badges}>
          {status}
          {difficulty}
        </span>
      </div>
      <div className={topicTileStyles.caption}>
        <span className={topicTileStyles.title} data-fallback={title ? undefined : true}>
          {name}
        </span>
        <span className={topicTileStyles.meta}>
          <span>{meta}</span>
          {dateTime ? <time dateTime={dateTime}>{date}</time> : <span>{date}</span>}
        </span>
      </div>
    </li>
  );
}

export type AdminColumnsProps = {
  /** detailは左に画像・右に編集、formは左に入力・右に案内、splitは同じ幅の2列 */
  layout?: "detail" | "form" | "split";
  primary: ReactNode;
  secondary: ReactNode;
};

// 2列（詳細・追加・一覧）。狭い画面では縦に並べる
export function AdminColumns({ layout = "detail", primary, secondary }: AdminColumnsProps) {
  return (
    <div className={variant(adminColumnsStyles, "root", { layout })}>
      <div className={adminColumnsStyles.primary}>{primary}</div>
      <div className={adminColumnsStyles.secondary}>{secondary}</div>
    </div>
  );
}

// 入力の画面の右に置く案内
export function AdminGuide({ items }: { items: { term: string; body: ReactNode }[] }) {
  return (
    <aside aria-label="案内">
      <dl className={adminGuideStyles.root}>
        <span className={adminGuideStyles.eyebrow} aria-hidden="true">
          Guide
        </span>
        {items.map((item) => (
          <div key={item.term}>
            <dt className={adminGuideStyles.term}>{item.term}</dt>
            <dd className={adminGuideStyles.body}>{item.body}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export type InfoRow = { term: string; value: ReactNode; code?: boolean };

// 項目名と値の一覧
export function InfoList({ label, rows }: { label?: string; rows: InfoRow[] }) {
  return (
    <dl className={infoListStyles.root} aria-label={label}>
      {rows.map((row) => (
        <div key={row.term} className={infoListStyles.row}>
          <dt className={infoListStyles.term}>{row.term}</dt>
          <dd className={infoListStyles.value}>
            {row.code ? <code className={infoListStyles.code}>{row.value}</code> : row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
