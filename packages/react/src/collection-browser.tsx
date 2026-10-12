import { useScrollViewport } from "./use-scroll-viewport";
import { Children, type ReactNode } from "react";
import { collectionBrowser } from "@animic/styled-system/recipes";
export function CollectionBrowser({
  filters,
  heading,
  children,
  empty,
  label,
}: {
  filters: ReactNode;
  heading: ReactNode;
  children: ReactNode;
  empty: ReactNode;
  label: string;
}) {
  const { ref: filtersScrollRef, scrollbars: filtersScrollBars } =
    useScrollViewport<HTMLDivElement>("絞り込み");
  const { ref: resultsScrollRef, scrollbars: resultsScrollBars } =
    useScrollViewport<HTMLDivElement>(label);
  const c = collectionBrowser();
  const items = Children.toArray(children);
  return (
    <div className={c.root}>
      <div className={c.filters} ref={filtersScrollRef} data-animic-scroll-viewport="">
        {filters}
        {filtersScrollBars}
      </div>
      <div className={c.main} ref={resultsScrollRef} data-animic-scroll-viewport="">
        <div className={c.heading}>{heading}</div>
        {items.length ? (
          <ul className={c.items} aria-label={label}>
            {Children.map(items, (child) => (
              <li>{child}</li>
            ))}
          </ul>
        ) : (
          <div className={c.empty}>{empty}</div>
        )}
        {resultsScrollBars}
      </div>
    </div>
  );
}
