import { topBar } from "@animic/styled-system/recipes";
import type { TopBarVariantProps } from "@animic/styled-system/recipes";
import type { MouseEvent, ReactNode } from "react";

export type TopBarProps = TopBarVariantProps & {
  logoSrc: string;
  /** ロゴの行き先。省くとリンクにしない */
  logoHref?: string;
  onLogoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
};

// 画面の上に置くバー。左にロゴ、右に操作や状況
export function TopBar({ logoSrc, logoHref, onLogoClick, variant, children }: TopBarProps) {
  const classes = topBar({ variant });
  const logo = (
    <img
      className={classes.logo}
      src={logoSrc}
      alt={logoHref ? "Animic トップ" : "Animic"}
      width="2078"
      height="607"
    />
  );
  return (
    <header className={classes.root}>
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
  return <div className={topBar().side}>{children}</div>;
}
