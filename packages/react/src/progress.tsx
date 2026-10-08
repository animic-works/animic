import { useId, type CSSProperties } from "react";
import { Progress as ArkProgress } from "@ark-ui/react/progress";
import { progress } from "@animic/styled-system/recipes";
export interface ProgressProps {
  striped?: boolean;
  emphasis?: "normal" | "urgent";
  label: string;
  value: number | null;
  presentation?: "labeled" | "track";
  tone?: "primary" | "gradient" | "highlight";
}
export function Progress({ label, value, presentation, tone, striped, emphasis }: ProgressProps) {
  const classes = progress({ presentation, tone, striped, emphasis });
  const labelId = useId();
  const percent =
    value === null ? null : Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const style: CSSProperties & { "--animic-progress-value": string } = {
    "--animic-progress-value": `${percent ?? 100}%`,
  };
  return (
    <ArkProgress.Root value={percent} ids={{ label: labelId }} className={classes.root}>
      <ArkProgress.Label className={classes.label}>{label}</ArkProgress.Label>
      <ArkProgress.Track className={classes.track} aria-labelledby={labelId}>
        <ArkProgress.Context>
          {/* 割合の描画はRecipeが所有し、Arkのwidthとclip-pathを二重に適用しない。 */}
          {(api) => <div {...api.getRangeProps()} className={classes.fill} style={style} />}
        </ArkProgress.Context>
      </ArkProgress.Track>
      {percent === null ? (
        <span className={classes.value}>処理中</span>
      ) : (
        <ArkProgress.ValueText className={classes.value} />
      )}
    </ArkProgress.Root>
  );
}
