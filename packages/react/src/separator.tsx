import { separator } from "@animic/styled-system/recipes";
export function Separator({
  appearance = "solid",
  label,
}: {
  appearance?: "solid" | "dashed";
  label?: string;
}) {
  if (label)
    return (
      <div role="separator" aria-label={label} className={separator({ appearance, labeled: true })}>
        {label}
      </div>
    );
  return <hr className={separator({ appearance })} />;
}
