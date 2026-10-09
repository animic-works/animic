import type { ReactNode } from "react";
import { focusLayout } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
import { LayoutHeader } from "./layout-header";

export interface FocusLayoutProps extends CommonProps<HTMLElement> {
  back?: ReactNode;
  compactBack?: ReactNode;
  compactTitle?: ReactNode;
  artwork?: ReactNode;
}

export function FocusLayout({ ref, ...props }: FocusLayoutProps) {
  const styles = focusLayout();
  return (
    <main {...domProps(props)} ref={ref} className={styles.root}>
      <LayoutHeader
        back={props.back}
        compactBack={props.compactBack}
        compactTitle={props.compactTitle}
        compactPresentation="overlay"
      />
      {props.artwork && (
        <div className={styles.artwork} aria-hidden="true" inert>
          {props.artwork}
        </div>
      )}
      <div className={styles.content}>{props.children}</div>
    </main>
  );
}

export function FocusLayoutBrand({ children }: { children: ReactNode }) {
  return <div className={focusLayout().brand}>{children}</div>;
}
