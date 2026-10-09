import { statGroup } from "@animic/styled-system/recipes";
export function StatGroup({
  items,
}: {
  items: readonly { label: string; value: string | number; unit?: string; accent?: boolean }[];
}) {
  const c = statGroup();
  return (
    <div className={c.root} data-count={items.length}>
      {items.map((item) => (
        <div key={item.label} className={c.item} data-accent={item.accent || undefined}>
          <span className={c.label}>{item.label}</span>
          <span className={c.value}>
            {item.value}
            <span className={c.unit}>{item.unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
