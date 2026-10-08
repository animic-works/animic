import type { ReactNode } from "react";
import { comparisonStage } from "@animic/styled-system/recipes";
export function ComparisonStage({
  first,
  second,
  children,
}: {
  first: ReactNode;
  second: ReactNode;
  children: ReactNode;
}) {
  const c = comparisonStage();
  return (
    <div className={c.root}>
      <div className={c.layout}>
        <div className={c.first}>{first}</div>
        <div className={c.body}>{children}</div>
        <div className={c.second}>{second}</div>
      </div>
    </div>
  );
}
