import { progressList } from "@animic/styled-system/recipes";
export interface ProgressListItem {
  id: string;
  label: string;
  state: "pending" | "active" | "complete";
  value?: string;
  progress?: number;
}
export interface ProgressListProps {
  label: string;
  groups: Array<{ id: string; label: string; value?: string; items: ProgressListItem[] }>;
}
export function ProgressList({ label, groups }: ProgressListProps) {
  const c = progressList();
  return (
    <div className={c.root} role="group" aria-label={label}>
      {groups.map((group) => (
        <div className={c.group} key={group.id}>
          <div className={c.heading}>
            <span>{group.label}</span>
            <span
              className={c.groupValue}
              data-complete={group.items.every((item) => item.state === "complete") || undefined}
            >
              {group.value ?? "—"}
            </span>
          </div>
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
                          strokeDasharray={`${progress} 100`}
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
                  <span className={s.value}>{item.value ?? "—"}</span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
