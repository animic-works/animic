import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

import { configVariant, variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import appBarStyles from "./app-bar.module.css";
import cornerLogoStyles from "./corner-logo.module.css";
import landingNavStyles from "./landing-nav.module.css";
import pagerStyles from "./pager.module.css";

type NavItem = { id: string; label: string };

export type LandingNavProps = {
  items: NavItem[];
  /** 表示中の画面に対応する項目のid。対応する項目がない画面では null */
  currentId: string | null;
  onSelect: (id: string) => void;
  /** 右端の目立つ操作（「スタート」「ルームに参加」。NavCta） */
  actions: ReactNode;
};

// 右上のナビ。表示中の画面を示す下線が横へ移動する。スマホでは出さず、AppBar に替える
export function LandingNav({ items, currentId, onSelect, actions }: LandingNavProps) {
  const root = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{
    style: CSSProperties;
    shown: boolean;
    appearing: boolean;
  }>({ style: {}, shown: false, appearing: true });

  // 下線の位置は表示中の項目の位置から測る（フォントの読み込みや幅の変化でも合わせ直す）。
  // 隠れている状態から出すときは位置を動かさずにその場で現す（上端から降りてこないように）
  useEffect(() => {
    function move() {
      const link = currentId
        ? root.current?.querySelector<HTMLAnchorElement>(`a[href="#${currentId}"]`)
        : null;
      if (!link) {
        setIndicator((previous) => ({
          style: { ...previous.style, "--nav-indicator-opacity": "0" },
          shown: false,
          appearing: true,
        }));
        return;
      }
      setIndicator((previous) => ({
        style: {
          "--nav-indicator-opacity": "1",
          "--nav-indicator-left": `${link.offsetLeft}px`,
          "--nav-indicator-width": `${link.offsetWidth}px`,
          "--nav-indicator-top": `${link.offsetTop + link.offsetHeight - 2}px`,
        },
        shown: true,
        appearing: !previous.shown,
      }));
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
    <nav ref={root} className={landingNavStyles.root} aria-label="メインメニュー">
      {items.map((item) => (
        <a
          key={item.id}
          className={landingNavStyles.link}
          href={`#${item.id}`}
          aria-current={item.id === currentId ? "page" : undefined}
          onClick={(event) => jump(event, item.id)}
        >
          {item.label}
        </a>
      ))}
      {actions}
      <span
        className={landingNavStyles.indicator}
        style={indicator.style}
        data-appearing={indicator.appearing || undefined}
        aria-hidden="true"
      />
    </nav>
  );
}

export type NavCtaProps = {
  /** start: ピンクの「スタート」 / join: 白地の「ルームに参加」 */
  kind: "start" | "join";
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  icon: ReactNode;
  children: ReactNode;
};

// ナビの中で目立たせる「スタート」「ルームに参加」
export function NavCta({ kind, href, onClick, icon, children }: NavCtaProps) {
  return (
    <a className={variant(landingNavStyles, "cta", { cta: kind })} href={href} onClick={onClick}>
      {icon}
      {children}
    </a>
  );
}

export type AppBarProps = {
  logoSrc: string;
  /** ホーム以外の画面で出す */
  shown: boolean;
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void;
  onStart: () => void;
  onJoin: () => void;
};

// スマホの上のバー: ホーム以外の画面で上から降りてくる。小さなロゴと「スタート」「参加」
export function AppBar({ logoSrc, shown, onHome, onStart, onJoin }: AppBarProps) {
  return (
    <header className={appBarStyles.root} data-shown={shown || undefined}>
      <a className={appBarStyles.logo} href="#top" onClick={onHome}>
        <img src={logoSrc} alt="Animic ホームへ" width="2078" height="607" />
      </a>
      <div className={appBarStyles.actions}>
        <button type="button" className={appBarStyles.start} onClick={onStart}>
          <Icon name="play" size="sm" />
          スタート
        </button>
        <button
          type="button"
          className={appBarStyles.join}
          aria-label="ルームに参加"
          onClick={onJoin}
        >
          <Icon name="enter" size="lg" />
          <span className={appBarStyles.joinLabel}>
            <span className={appBarStyles.joinLong}>ルームに</span>参加
          </span>
        </button>
      </div>
    </header>
  );
}

export type CornerLogoProps = {
  src: string;
  href: string;
  shown: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

// 左上のロゴ: ホーム以外の画面で表示し、ホームへ戻る
export function CornerLogo({ src, href, onClick, shown }: CornerLogoProps) {
  return (
    <a className={configVariant(cornerLogoStyles, { shown })} href={href} onClick={onClick}>
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
  return (
    <ol className={pagerStyles.root} aria-label="画面">
      {labels.map((label, index) => (
        <li key={label}>
          <button
            type="button"
            className={pagerStyles.dot}
            aria-label={label}
            aria-current={index === current ? "true" : "false"}
            onClick={() => onSelect(index)}
          />
        </li>
      ))}
    </ol>
  );
}
