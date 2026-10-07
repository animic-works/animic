// スタイルの当て方はデザインシステムのレシピで決まる。ここではレシピから機械変換した
// CSS Modules（1レシピ1ファイル）のクラス名を組み立てるだけの小さな道具を置く。
//
// スロットレシピ（複数要素）のクラスは `.<slot>` と `.<slot>--<key>_<value>`。
//   例: avatar の root は `variant(styles, "root", { player: "1", size: "md" })`。
// 設定レシピ（単一要素）のクラスは `.root` と `.<key>_<value>`、複合は `.compound__<...>`。
//   例: button は `configVariant(styles, { variant: "primary", size: "lg" })` に、
//   一致する複合クラス（`styles.compound__size_hero__variant_primary` など）を cx で足す。
// どちらも省いた prop には呼び出し側でレシピの defaultVariants を当ててから渡す。

/** 真の値のクラス名だけを半角スペースでつなぐ */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type VariantValues = Record<string, string | number | boolean | null | undefined>;

/** スロットレシピの1スロット分のクラス（基底と各variant）を組み立てる */
export function variant(
  styles: Readonly<Record<string, string>>,
  part: string,
  values: VariantValues,
): string {
  return cx(
    styles[part],
    ...Object.entries(values).map(([key, value]) => styles[`${part}--${key}_${String(value)}`]),
  );
}

/** 設定レシピ（単一要素）のクラス（基底と各variant）を組み立てる */
export function configVariant(
  styles: Readonly<Record<string, string>>,
  values: VariantValues,
): string {
  return cx(
    styles.root,
    ...Object.entries(values).map(([key, value]) => styles[`${key}_${String(value)}`]),
  );
}
