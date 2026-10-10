import type { ReactNode } from "react";
import { comparison } from "@animic/styled-system/recipes";
export function Comparison({
  header,
  first,
  second,
  history,
  historyHeading,
  preferences,
  actions,
  decoration,
  firstCaption,
  secondCaption,
  description,
}: {
  header?: ReactNode;
  decoration?: ReactNode;
  first: ReactNode;
  second: ReactNode;
  firstCaption?: ReactNode;
  secondCaption?: ReactNode;
  description?: ReactNode;
  history: ReactNode;
  historyHeading?: ReactNode;
  preferences?: ReactNode;
  actions: ReactNode;
}) {
  const c = comparison();
  return (
    <div className={c.root}>
      {header && <div className={c.header}>{header}</div>}
      <div className={c.images}>
        <div className={c.first}>
          <div className={c.artwork}>{first}</div>
          <div className={c.caption}>
            {firstCaption}
            {description && <span className={c.description}>{description}</span>}
          </div>
        </div>
        <div className={c.second}>
          <div className={c.artwork}>{second}</div>
          <div className={c.caption}>{secondCaption}</div>
        </div>
        {decoration && (
          <div className={c.decoration} aria-hidden="true">
            {decoration}
          </div>
        )}
      </div>
      <div className={c.tools}>
        <div className={c.history}>
          <div className={c.heading}>{historyHeading}</div>
          {history}
        </div>
        <div className={c.actions}>
          <div className={c.preferences}>{preferences}</div>
          {actions}
        </div>
      </div>
    </div>
  );
}
