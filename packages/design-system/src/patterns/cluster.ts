import { definePattern } from "@pandacss/dev";

// 横に並べ、入りきらなければ折り返す（タグ・ボタンの並び）
export const cluster = definePattern({
  description: "子要素を横に並べ、幅が足りなければ折り返す",
  properties: {
    gap: { type: "token", value: "spacing" },
    // 揃えはCSSの値をそのまま受け取らず、決めた中から選ぶ
    align: { type: "enum", value: ["start", "center", "end", "stretch", "baseline"] },
    justify: { type: "enum", value: ["start", "center", "end", "between"] },
    nowrap: { type: "boolean" },
  },
  defaultValues: { gap: "2", align: "center" },
  // transformは生成コードに埋め込まれるため、外の値を参照しない
  transform(props) {
    const { gap, align, justify, nowrap, ...rest } = props;
    const alignMap: Record<string, string> = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      stretch: "stretch",
      baseline: "baseline",
    };
    const justifyMap: Record<string, string> = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      between: "space-between",
    };
    return {
      display: "flex",
      flexWrap: nowrap ? "nowrap" : "wrap",
      gap,
      alignItems: alignMap[align],
      justifyContent: justifyMap[justify],
      minWidth: "0",
      ...rest,
    };
  },
});
