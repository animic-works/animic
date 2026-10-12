import { readout } from "@animic/styled-system/recipes";
export function Readout({
  label,
  value,
  tone = "neutral",
  role,
  presentation,
  emphasis,
  format = "text",
  fill,
}: {
  /** 外側で決めた大きさいっぱいに広げる。文言の長さによらず同じ大きさで並べるときに使う。 */
  fill?: boolean;
  role?: "timer" | "status";
  label: string;
  value: string;
  tone?: "neutral" | "highlight" | "primary" | "violet" | "indigo";
  presentation?: "panel" | "stamp";
  emphasis?: "normal" | "urgent";
  format?: "text" | "clock";
}) {
  const c = readout({ tone, presentation, emphasis, format, fill });
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
