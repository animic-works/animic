import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import { navigationBar } from "@animic/styled-system/recipes";
import { observeNavigationLayout } from "./navigation-layout";
import { observeNavigationIndicator } from "./navigation-indicator";

export interface NavigationBarProps {
  label: string;
  brand?: ReactNode;
  actions?: ReactNode;
  primaryActions?: ReactNode;
  children: ReactNode;
  compactHidden?: boolean;
  brandHidden?: boolean;
}

export function NavigationBar({
  label,
  brand,
  actions,
  primaryActions,
  children,
  compactHidden,
  brandHidden,
}: NavigationBarProps) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const header = root.current;
    const page = header?.closest<HTMLElement>("[data-animic-page]");
    if (!header || !page) return undefined;
    const indicator = observeNavigationIndicator(header);
    const disposeLayout = observeNavigationLayout(page, indicator.update);
    return () => {
      disposeLayout();
      indicator.dispose();
    };
  }, []);
  useLayoutEffect(() => {
    if (!brandHidden) root.current?.removeAttribute("data-initial-visible");
  }, [brandHidden]);
  const classes = navigationBar({ compactHidden, brandHidden });
  return (
    <header ref={root} suppressHydrationWarning className={classes.root} data-animic-navigation="">
      {brand && (
        <div className={classes.brand} inert={brandHidden} aria-hidden={brandHidden || undefined}>
          {brand}
        </div>
      )}
      <div className={classes.content} data-animic-navigation-content="">
        <nav className={classes.links} aria-label={label}>
          {children}
          <span
            className={classes.indicator}
            data-animic-navigation-indicator=""
            aria-hidden="true"
          />
        </nav>
        {primaryActions && (
          <div className={classes.primaryActions} data-animic-navigation-primary="">
            {primaryActions}
          </div>
        )}
      </div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </header>
  );
}

export function NavigationBarLabel({ children }: { children: ReactNode }) {
  return <span className={navigationBar().label}>{children}</span>;
}
