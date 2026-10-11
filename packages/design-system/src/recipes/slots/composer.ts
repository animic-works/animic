import { defineSlotRecipe } from "@pandacss/dev";
export const composer = defineSlotRecipe({
  className: "composer",
  slots: [
    "root",
    "header",
    "title",
    "eyebrow",
    "controls",
    "tabs",
    "input",
    "tools",
    "footer",
    "summary",
    "action",
  ],
  base: {
    root: {
      containerType: "inline-size",
      containerName: "animic-composer",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateRows: "auto auto minmax(8rem, 1fr) auto auto",
      gap: "3",
      minHeight: 0,
      minWidth: 0,
    },
    // 見出しと入力方法の切り替えは、狭い幅でも同じ行に置く。
    header: {
      display: "flex",
      flexWrap: "nowrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "3",
    },
    // 見出しは折り返さない。
    title: { minWidth: 0, flexShrink: 0, whiteSpace: "nowrap" },
    // 入力方法の切り替えは縮めず、見出しの右に置く。
    controls: { flexShrink: 0 },
    eyebrow: {
      textStyle: "eyebrow.strong",
      color: "accent.primary",
      _composerCompact: { display: "none" },
    },
    // 欄の切り替えは縮めず、入らなければ横にスクロールする。
    tabs: { minWidth: 0, overflowX: "auto", scrollbarWidth: "none" },
    input: { minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" },
    // 検索の2つの操作は横に並べる。
    tools: {
      display: "grid",
      gap: "2",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      "& > button": { whiteSpace: "nowrap", minWidth: 0 },
    },
    footer: {
      display: "grid",
      gap: "3",
      _composerCompact: {
        gridTemplateColumns: "minmax(0, 5.5rem) minmax(0, 1fr)",
        alignItems: "center",
        gap: "4",
      },
    },
    // 生成できない理由と生成回数は1行にし、入らない理由は省略する。
    summary: {
      minWidth: 0,
      paddingInlineEnd: "2",
      "& > * > :first-child": {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      "& > * > :last-child": { flexShrink: 0, whiteSpace: "nowrap" },
    },
    action: { display: "grid", minWidth: 0 },
  },
});
