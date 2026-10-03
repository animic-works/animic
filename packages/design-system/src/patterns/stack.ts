import { definePattern } from "@pandacss/dev";

// 縦に積む。要素のあいだの余白はgapだけで決め、要素の側に余白を持たせない
export const stack = definePattern({
  description: "子要素を縦（または横）に一定の間隔で並べる",
  properties: {
    gap: { type: "token", value: "spacing" },
    direction: { type: "enum", value: ["column", "row"] },
    // 揃えはCSSの値をそのまま受け取らず、決めた中から選ぶ
    align: { type: "enum", value: ["start", "center", "end", "stretch", "baseline"] },
    justify: { type: "enum", value: ["start", "center", "end", "between"] },
  },
  defaultValues: { gap: "4", direction: "column" },
  // transformは生成コードに埋め込まれるため、外の値を参照しない
  transform(props) {
    const { gap, direction, align, justify, ...rest } = props;
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
      flexDirection: direction,
      gap,
      alignItems: alignMap[align],
      justifyContent: justifyMap[justify],
      minWidth: "0",
      ...rest,
    };
  },
});
