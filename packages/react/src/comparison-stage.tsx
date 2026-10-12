import type { ReactNode } from "react";
import { comparisonStage } from "@animic/styled-system/recipes";
export function ComparisonStage({
  first,
  second,
  children,
  size,
  fill,
}: {
  first: ReactNode;
  second: ReactNode;
  children: ReactNode;
  /** `compact`は狭い画面で画像を小さくし、パネルと下の一覧まで1画面に収める。 */
  size?: "standard" | "compact";
  /** 2つの比較対象の欄を同じ高さに伸ばす。中の面は`Surface`の`fill`などで欄の高さに合わせる。 */
  fill?: boolean;
}) {
  const c = comparisonStage({ size, fill });
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
