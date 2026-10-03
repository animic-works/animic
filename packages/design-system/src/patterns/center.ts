import { definePattern } from "@pandacss/dev";

// 中身を縦横の中央に置く。fillで画面の高さいっぱいを使う
export const center = definePattern({
  description: "子要素を縦横の中央に置く",
  properties: {
    fill: { type: "boolean" },
  },
  transform(props) {
    const { fill, ...rest } = props;
    return {
      display: "grid",
      placeItems: "center",
      minHeight: fill ? "100svh" : undefined,
      ...rest,
    };
  },
});
