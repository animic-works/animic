import { definePattern } from "@pandacss/dev";

// 画面の中央に、最大幅を決めて置く。左右には画面の端との余白を取る
export const container = definePattern({
  description: "内容の最大幅を決めて中央に置く",
  properties: {
    size: { type: "enum", value: ["prose", "sm", "md", "lg", "xl"] },
  },
  defaultValues: { size: "lg" },
  transform(props) {
    const { size, ...rest } = props;
    return {
      width: "full",
      maxWidth: size,
      mx: "auto",
      px: { base: "4", md: "6" },
      py: { base: "4", md: "6" },
      ...rest,
    };
  },
});
