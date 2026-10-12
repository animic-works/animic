import { grade } from "@animic/styled-system/recipes";

/**
 * 点数の段階を表す1〜2文字の印。`label`は読み上げる名前（例：「ランクS」）。
 * 段階の決め方と`tone`の対応は利用側が持つ。
 */
export function Grade({
  value,
  label,
  tone,
  size,
}: {
  value: string;
  label: string;
  tone?: "neutral" | "highlight" | "primary" | "secondary" | "success";
  size?: "sm" | "lg";
}) {
  return (
    <span role="img" aria-label={label} className={grade({ tone, size })}>
      <span aria-hidden="true">{value}</span>
    </span>
  );
}
