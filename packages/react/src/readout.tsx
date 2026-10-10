import { readout } from "@animic/styled-system/recipes";
export function Readout({
  label,
  value,
  tone = "neutral",
  role,
  presentation,
  emphasis,
  format = "text",
}: {
  role?: "timer" | "status";
  label: string;
  value: string;
  tone?: "neutral" | "highlight" | "primary";
  presentation?: "panel" | "stamp";
  emphasis?: "normal" | "urgent";
  format?: "text" | "clock";
}) {
  const c = readout({ tone, presentation, emphasis, format });
  return (
    <div className={c.root} role={role} aria-label={label}>
      <span className={c.label}>{label}</span>
      <span className={c.value}>
        {format === "clock" && <span className={c.accessibleValue}>{value}</span>}
        {format === "clock"
          ? Array.from(value, (character, index) => (
              <span
                key={index}
                className={character === ":" ? c.separator : c.digit}
                aria-hidden="true"
              >
                {character}
              </span>
            ))
          : value}
      </span>
    </div>
  );
}
