import { appBar, cornerLogo, landingNav, pager } from "@animic/styled-system/recipes";
import type { CornerLogoVariantProps, LandingNavVariantProps } from "@animic/styled-system/recipes";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

import { Icon } from "../icon/icon";

export type NavItem = { id: string; label: string };

export type LandingNavProps = {
  items: NavItem[];
  /** 表示中の画面に対応する項目のid。対応する項目がない画面では null */
  currentId: string | null;
  onSelect: (id: string) => void;
  /** 右端の目立つ操作（「スタート」「ルームに参加」。NavCta） */
  actions: ReactNode;
  /** いちばん右のアカウント（NavLogin など）。区切り線のあとに置く */
  account?: ReactNode;
};

// 右上のナビ。表示中の画面を示す下線が横へ移動する。スマホでは出さず、AppBar に替える
export function LandingNav({ items, currentId, onSelect, actions, account }: LandingNavProps) {
  const classes = landingNav();
  const root = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<CSSProperties>({});

  // 下線の位置は表示中の項目の位置から測る（フォントの読み込みや幅の変化でも合わせ直す）
  useEffect(() => {
    function move() {
      const link = currentId
        ? root.current?.querySelector<HTMLAnchorElement>(`a[href="#${currentId}"]`)
        : null;
      if (!link) {
        setIndicator({ "--nav-indicator-opacity": "0" });
        return;
      }
      setIndicator({
        "--nav-indicator-opacity": "1",
        "--nav-indicator-left": `${link.offsetLeft}px`,
        "--nav-indicator-width": `${link.offsetWidth}px`,
        "--nav-indicator-top": `${link.offsetTop + link.offsetHeight - 2}px`,
      });
    }
    move();
    addEventListener("resize", move);
    void document.fonts?.ready.then(move);
    return () => removeEventListener("resize", move);
  }, [currentId]);

  function jump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    onSelect(id);
  }

  return (
    <nav ref={root} className={classes.root} aria-label="メインメニュー">
      {items.map((item) => (
        <a
          key={item.id}
          className={classes.link}
          href={`#${item.id}`}
          aria-current={item.id === currentId ? "page" : undefined}
          onClick={(event) => jump(event, item.id)}
        >
          {item.label}
        </a>
      ))}
      {actions}
      {account ? <span className={classes.account}>{account}</span> : null}
      <span className={classes.indicator} style={indicator} aria-hidden="true" />
    </nav>
  );
}

export type NavCtaProps = {
  /** start: ピンクの「スタート」 / join: 白地の「ルームに参加」 */
  kind: NonNullable<LandingNavVariantProps["cta"]>;
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  icon: ReactNode;
  children: ReactNode;
};

// ナビの中で目立たせる「スタート」「ルームに参加」
export function NavCta({ kind, href, onClick, icon, children }: NavCtaProps) {
  const classes = landingNav({ cta: kind });
  return (
    <a className={classes.cta} href={href} onClick={onClick}>
      {icon}
      {children}
    </a>
  );
}

export type NavLoginProps = {
  onClick: () => void;
  /** 幅の狭いバーでは人のアイコンだけにする */
  compact?: boolean;
};

// ゲストに見せる「ログイン」
export function NavLogin({ onClick, compact = false }: NavLoginProps) {
  const classes = landingNav();
  return (
    <button
      type="button"
      className={classes.login}
      data-compact={compact || undefined}
      aria-label="ログイン"
      onClick={onClick}
    >
      <Icon name="user" size="md" />
      <span>ログイン</span>
    </button>
  );
}

export type AppBarProps = {
  logoSrc: string;
  /** ホーム以外の画面で出す */
  shown: boolean;
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void;
  onStart: () => void;
  onJoin: () => void;
  account?: ReactNode;
};

// スマホの上のバー: ホーム以外の画面で上から降りてくる。小さなロゴと「スタート」「参加」「ログイン」
export function AppBar({ logoSrc, shown, onHome, onStart, onJoin, account }: AppBarProps) {
  const classes = appBar();
  return (
    <header className={classes.root} data-shown={shown || undefined}>
      <a className={classes.logo} href="#top" onClick={onHome}>
        <img src={logoSrc} alt="Animic ホームへ" width="2078" height="607" />
      </a>
      <div className={classes.actions}>
        <button type="button" className={classes.start} onClick={onStart}>
          <Icon name="play" size="sm" />
          スタート
        </button>
        <button type="button" className={classes.join} aria-label="ルームに参加" onClick={onJoin}>
          <Icon name="enter" size="lg" />
          <span className={classes.joinLabel}>
            <span className={classes.joinLong}>ルームに</span>参加
          </span>
        </button>
        {account ? <span className={classes.account}>{account}</span> : null}
      </div>
    </header>
  );
}

export type CornerLogoProps = CornerLogoVariantProps & {
  src: string;
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

// 左上のロゴ: ホーム以外の画面で表示し、ホームへ戻る
export function CornerLogo({ src, href, onClick, shown }: CornerLogoProps) {
  return (
    <a className={cornerLogo({ shown })} href={href} onClick={onClick}>
      <img src={src} alt="Animic ホームへ" width="2078" height="607" />
    </a>
  );
}

export type PagerProps = {
  labels: string[];
  current: number;
  onSelect: (index: number) => void;
};

// 右端の現在位置
export function Pager({ labels, current, onSelect }: PagerProps) {
  const classes = pager();
  return (
    <ol className={classes.root} aria-label="画面">
      {labels.map((label, index) => (
        <li key={label}>
          <button
            type="button"
            className={classes.dot}
            aria-label={label}
            aria-current={index === current ? "true" : "false"}
            onClick={() => onSelect(index)}
          />
        </li>
      ))}
    </ol>
  );
}
