import type { MouseEvent, ReactNode } from "react";

import { variant } from "./cx";
import topBarStyles from "./top-bar.module.css";

export type TopBarProps = {
  logoSrc: string;
  /** ロゴの行き先。省くとリンクにしない */
  logoHref?: string;
  onLogoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  variant?: "plain" | "sticky" | "result";
  children?: ReactNode;
};

// 画面の上に置くバー。左にロゴ、右に操作や状況
export function TopBar({
  logoSrc,
  logoHref,
  onLogoClick,
  variant: barVariant = "plain",
  children,
}: TopBarProps) {
  const logo = (
    <img
      className={variant(topBarStyles, "logo", { variant: barVariant })}
      src={logoSrc}
      alt={logoHref ? "Animic トップ" : "Animic"}
      width="2078"
      height="607"
    />
  );
  return (
    <header className={variant(topBarStyles, "root", { variant: barVariant })}>
      {logoHref ? (
        <a href={logoHref} onClick={onLogoClick}>
          {logo}
        </a>
      ) : (
        logo
      )}
      {children}
    </header>
  );
}

// バーの左右の端のまとまり
export function TopBarSide({ children }: { children: ReactNode }) {
  return <div className={topBarStyles.side}>{children}</div>;
}
