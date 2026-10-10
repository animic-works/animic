import { useId, type CSSProperties } from "react";
import { meter } from "@animic/styled-system/recipes";

export interface MeterProps {
  label: string;
  tone?: "gradient" | "primary" | "secondary" | "highlight" | "success";
  appearance?: "standard" | "inverse";
  description?: string;
  presentation?: "labeled" | "track" | "row";
  value: number;
  valueText?: string;
}

export function Meter({
  label,
  description,
  value,
  valueText,
  presentation,
  tone,
  appearance,
}: MeterProps) {
  const labelId = useId();
  const classes = meter({ presentation, tone, appearance });
  const percent = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const text = valueText ?? `${percent}%`;
  const style: CSSProperties & { "--animic-meter-value": string } = {
    "--animic-meter-value": `${percent}%`,
  };
  return (
    <div className={classes.root}>
      <div className={classes.heading}>
        <span id={labelId} className={classes.label}>
          {label}
          {description && <small className={classes.description}>{description}</small>}
        </span>
        <span className={classes.value} aria-hidden="true">
          {valueText ?? (
            <>
              {percent}
              <small>%</small>
            </>
          )}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={text}
        className={classes.track}
      >
        <div className={classes.fill} style={style} />
      </div>
    </div>
  );
}
