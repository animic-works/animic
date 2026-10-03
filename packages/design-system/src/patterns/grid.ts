import { definePattern } from "@pandacss/dev";

// 格子に並べる。columnsで列の数を、minChildWidthで1つの最小幅（入るだけ並べる）を決める
export const grid = definePattern({
  description: "子要素を格子状に並べる",
  properties: {
    gap: { type: "token", value: "spacing" },
    columns: { type: "number" },
    minChildWidth: { type: "token", value: "sizes" },
  },
  defaultValues: { gap: "4" },
  transform(props, { map }) {
    const { gap, columns, minChildWidth, ...rest } = props;
    return {
      display: "grid",
      gap,
      gridTemplateColumns:
        columns != null
          ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`)
          : minChildWidth != null
            ? map(minChildWidth, (v) => `repeat(auto-fill, minmax(token(sizes.${v}, ${v}), 1fr))`)
            : undefined,
      ...rest,
    };
  },
});
