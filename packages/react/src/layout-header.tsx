import type { ReactNode } from "react";
import { layoutHeader } from "@animic/styled-system/recipes";

/** 画面レイアウトで共有する戻る操作とコンパクト見出しの配置。 */
export function LayoutHeader({
  back,
  compactBack,
  compactTitle,
  compactPresentation,
}: {
  back?: ReactNode;
  compactBack?: ReactNode;
  compactTitle?: ReactNode;
  compactPresentation: "overlay" | "bar";
}) {
  const styles = layoutHeader({ compactBack: Boolean(compactBack), compactPresentation });
  return (
    <header className={styles.root}>
      <div className={styles.back}>{back}</div>
      {compactBack && <div className={styles.compactBack}>{compactBack}</div>}
      <div className={styles.title}>{compactTitle}</div>
    </header>
  );
}
