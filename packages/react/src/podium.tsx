import type { ReactNode } from "react";
import { podium } from "@animic/styled-system/recipes";
export function Podium({
  items,
  entering = false,
  presentation,
}: {
  entering?: boolean;
  /** `card`は人ごとの縦長のカードにし、枠と下の帯を順位の色で塗る。 */
  presentation?: "steps" | "card";
  items: readonly {
    id: string;
    src: string;
    label: string;
    name: ReactNode;
    avatar?: ReactNode;
    value: ReactNode;
    rank: number;
    decoration?: ReactNode;
    /** 順位の帯の飾り。読み上げには出さない。 */
    stepDecoration?: ReactNode;
  }[];
}) {
  return (
    <div className={podium({ presentation }).root}>
      {items.slice(0, 3).map((item, i) => {
        const c = podium({
          entering,
          presentation,
          place: i === 0 ? "first" : i === 1 ? "second" : "third",
        });
        return (
          <div key={item.id} className={c.item}>
            {item.decoration && <span className={c.decoration}>{item.decoration}</span>}
            <img className={c.image} src={item.src} alt={item.label} draggable={false} />
            <div className={c.name}>
              {item.avatar && <span className={c.avatar}>{item.avatar}</span>}
              {item.name}
            </div>
            <div className={c.value}>{item.value}</div>
            <div className={c.step}>
              {item.stepDecoration && (
                <span className={c.stepDecoration} aria-hidden="true">
                  {item.stepDecoration}
                </span>
              )}
              {item.rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}
