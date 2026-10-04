import type { CSSProperties } from "react";
import { Progress as ArkProgress } from "@ark-ui/react/progress";
import { progress } from "@animic/styled-system/recipes";
export interface ProgressProps {
  label: string;
  value: number | null;
}
export function Progress({ label, value }: ProgressProps) {
  const classes = progress();
  const percent =
    value === null ? null : Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const style: CSSProperties & { "--animic-progress-value": string } = {
    "--animic-progress-value": `${percent ?? 100}%`,
  };
  return (
    <ArkProgress.Root value={percent} className={classes.root}>
      <ArkProgress.Label className={classes.label}>{label}</ArkProgress.Label>
      <ArkProgress.Track className={classes.track}>
        <ArkProgress.Range className={classes.fill} style={style} />
      </ArkProgress.Track>
      {percent === null ? (
        <span className={classes.value}>処理中</span>
      ) : (
        <ArkProgress.ValueText className={classes.value} />
      )}
    </ArkProgress.Root>
  );
}
