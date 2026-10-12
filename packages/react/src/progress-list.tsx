import type { CSSProperties } from "react";
import { progressList, text } from "@animic/styled-system/recipes";
import type { TextProps } from "./text";

/** 値の文字の色。値の意味（点数の段階など）に応じて利用側が選ぶ。 */
type ValueTone = TextProps["tone"];
export interface ProgressListItem {
  id: string;
  label: string;
  state: "pending" | "active" | "complete";
  value?: string;
  valueTone?: ValueTone;
  progress?: number;
}
export interface ProgressListProps {
  label: string;
  groups: Array<{
    id: string;
    label: string;
    /** `hidden`なら見出しの行（名前と値）を出さない。一覧の読み上げ名には`label`を使う。 */
    labelVisibility?: "visible" | "hidden";
    value?: string;
    valueTone?: ValueTone;
    items: ProgressListItem[];
  }>;
}
const toned = (tone: ValueTone) => (tone ? text({ variant: "inherit", tone }) : undefined);
export function ProgressList({ label, groups }: ProgressListProps) {
  const c = progressList();
  return (
    <div className={c.root} role="group" aria-label={label}>
      {groups.map((group) => (
        <div className={c.group} key={group.id}>
          {group.labelVisibility !== "hidden" && (
            <div className={c.heading}>
              <span>{group.label}</span>
              <span
                className={c.groupValue}
                data-complete={group.items.every((item) => item.state === "complete") || undefined}
              >
                <span className={toned(group.valueTone)}>{group.value ?? "—"}</span>
              </span>
            </div>
          )}
          <ol className={c.items} aria-label={group.label}>
            {group.items.map((item) => {
              const s = progressList({ state: item.state });
              const progress = Math.max(0, Math.min(100, item.progress ?? 0));
              return (
                <li
                  className={s.item}
                  key={item.id}
                  aria-current={item.state === "active" ? "step" : undefined}
                >
                  <span className={s.indicator} aria-hidden="true">
                    {item.state === "active" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <circle cx="12" cy="12" r="9" opacity=".2" />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          pathLength="100"
                          // 進み具合は利用側の時計の刻みで届くため、Recipeの遷移で刻みの間をつなぐ。
                          style={{ strokeDasharray: `${progress} 100` } satisfies CSSProperties}
                          data-progress=""
                          transform="rotate(-90 12 12)"
                        />
                      </svg>
                    )}
                    {item.state === "complete" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m7 12 3 3 7-7" />
                      </svg>
                    )}
                  </span>
                  <span className={s.label}>{item.label}</span>
                  <span className={s.value}>
                    <span className={toned(item.valueTone)}>{item.value ?? "—"}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
