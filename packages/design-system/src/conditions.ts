import base from "@pandacss/preset-base";
// 利用先ごとの成立条件。同じ値でも他のComponentへ自動適用しない。
const twoColumnsMin = "30em";
const wideLayoutMin = "54em";
export const conditions = {
  ...base.conditions,
  invalid: "&:is([aria-invalid=true], [data-invalid])",
  gridTwo: `@container animic-grid (min-width: ${twoColumnsMin})`,
  gridFull: `@container animic-grid (min-width: ${wideLayoutMin})`,
  splitEqual: `@container animic-split (min-width: ${twoColumnsMin})`,
  splitAsymmetric: `@container animic-split (min-width: ${wideLayoutMin})`,
  dialogCentered: `@container animic-dialog (min-width: ${twoColumnsMin})`,
};
