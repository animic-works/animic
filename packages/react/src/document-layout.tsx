import type { ReactNode } from "react";
import { documentLayout } from "@animic/styled-system/recipes";
import { LayoutHeader } from "./layout-header";
export function DocumentLayout({
  title,
  back,
  compactBack,
  children,
  scrollToTop,
}: {
  title: string;
  back: ReactNode;
  compactBack?: ReactNode;
  children: ReactNode;
  scrollToTop?: ReactNode;
}) {
  const c = documentLayout();
  return (
    <>
      <LayoutHeader
        back={back}
        compactBack={compactBack}
        compactTitle={title}
        compactPresentation="bar"
      />
      <main id="top" className={c.main}>
        {children}
      </main>
      {scrollToTop && <div className={c.top}>{scrollToTop}</div>}
    </>
  );
}
