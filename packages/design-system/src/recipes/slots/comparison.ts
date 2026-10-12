import { defineSlotRecipe } from "@pandacss/dev";
export const comparison = defineSlotRecipe({
  className: "comparison",
  slots: [
    "root",
    "header",
    "images",
    "first",
    "second",
    "tools",
    "history",
    "actions",
    "heading",
    "preferences",
    "decoration",
    "artwork",
    "caption",
    "description",
  ],
  base: {
    artwork: { minHeight: 0, minWidth: 0, display: "grid", placeItems: "center" },
    // 左右の見出しは札の有無にかかわらず同じ高さにする。
    caption: {
      minHeight: "1.75rem",
      display: "flex",
      flexWrap: "nowrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "2",
      textAlign: "center",
      minWidth: 0,
      // 「お題」と札は縮めず、説明だけを省略する。
      "& > *": { flexShrink: 0, whiteSpace: "nowrap" },
      "& > [class*=description]": { flexShrink: 1 },
      // 背の低い狭い画面では画像の幅が見出しより狭いため、札を次の行へ折り返す。
      _comparisonShort: { flexWrap: "wrap", rowGap: "1", alignContent: "start" },
    },
    // 見出しは1行に保ち、入らない説明は省略する。
    description: {
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      _comparisonCompact: { display: "none" },
    },
    decoration: { position: "absolute", inset: "0", pointerEvents: "none" },
    heading: { _comparisonCompact: { display: "none" } },
    // 狭い画面では幅がないため、設定は提出の確認の中だけで変える。
    preferences: { minWidth: 0, _comparisonCompact: { display: "none" } },
    header: {
      gridArea: "1 / 1 / 2 / -1",
      // 幅が広いときは見出しを左の列だけに置き、右の履歴の列を上から始める。
      _comparisonWide: { gridArea: "1 / 1 / 2 / 2" },
      _comparisonCompact: { display: "none" },
    },
    root: {
      padding: "1.1rem",
      layerStyle: "surface.raised",
      borderWidth: "2",
      borderRadius: "1.6rem",
      _comparisonCompact: {
        padding: "0",
        border: "0",
        borderRadius: "0",
        background: "transparent",
        boxShadow: "none",
        gap: "2",
      },
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateRows: "auto minmax(min-content, 1fr) auto",
      gap: "5",
      minHeight: "min-content",
      flex: "1 1 auto",
      _comparisonWide: { gridTemplateColumns: "minmax(0, 1fr) 12.25rem" },
    },
    images: {
      position: "relative",
      gridArea: "2 / 1",
      minHeight: "0",
      display: "grid",
      // 縦長の画像を、画面の高さに収まる幅まで縮める（ヘッダー・見出し・説明の分を引いた高さから求める）。
      // 履歴が下の段に並ぶ幅では、その分も引く。
      gridTemplateColumns:
        "repeat(2, min(calc(50% - 0.75rem), max(10rem, calc((100svh - 25rem) * 13 / 19))))",
      _comparisonWide: {
        gridTemplateColumns:
          "repeat(2, min(calc(50% - 0.75rem), max(10rem, calc((100svh - 18rem) * 13 / 19))))",
      },
      justifyContent: "center",
      gridTemplateRows: "auto auto",
      alignItems: "center",
      alignContent: "center",
      gap: "clamp(0.75rem, 2vw, 1.5rem)",
      minWidth: 0,
      _comparisonNarrow: {
        justifyContent: "center",
        // 縦長のタブレットで編集欄を畳んだときは、配置する側が変数で高さの上限を広げる。
        gridTemplateColumns:
          "repeat(2, min(calc(50% - 0.75rem), max(12rem, calc(var(--animic-comparison-media-block, 30svh) * 13 / 19))))",
      },
      _comparisonCompact: {
        paddingInline: "0",
        alignItems: "start",
        justifyContent: "center",
        // 高さの上限は、配置する側（畳んだ編集欄など）が変数で広げられる。
        // 見出し（「あなたの画像」）が収まる幅は下回らない。
        gridTemplateColumns:
          "repeat(2, min(calc(50% - 5px), max(5.75rem, calc(var(--animic-comparison-media-block, 25svh) * 13 / 19))))",
        gap: "0.625rem",
      },
      // 背の低い画面では、下の編集欄の高さを残すため画像を小さくする。
      _comparisonShort: {
        gridTemplateColumns:
          "repeat(2, min(calc(50% - 5px), max(5.75rem, calc(var(--animic-comparison-media-block, 17svh) * 13 / 19))))",
      },
    },
    first: {
      display: "grid",
      gridTemplateRows: "subgrid",
      gridRow: "1 / span 2",
      gridColumn: "1",
      minWidth: 0,
      width: "100%",
      justifySelf: "end",
    },
    second: {
      display: "grid",
      gridTemplateRows: "subgrid",
      gridRow: "1 / span 2",
      gridColumn: "2",
      minWidth: 0,
      width: "100%",
      justifySelf: "start",
    },
    tools: {
      gridArea: "3 / 1",
      minWidth: 0,
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 12rem)",
      alignItems: "end",
      gap: "4",
      paddingTop: "0.9rem",
      borderTop: "2px dashed token(colors.border.default)",
      _comparisonWide: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        gridArea: "1 / 2 / 3 / 3",
        borderLeft: "2px dashed token(colors.border.default)",
        paddingLeft: "5",
        paddingTop: "0",
        borderTop: "0",
      },
      _comparisonCompact: {
        display: "grid",
        // 高さに余裕がある配置では、配置する側が変数で履歴を1行に広げる（提出の操作はその下）。
        gridTemplateColumns:
          "var(--animic-comparison-tools-columns, minmax(0, 1fr) minmax(0, 1.8fr))",
        alignItems: "center",
        gap: "3",
        paddingTop: "0",
        borderTop: "0",
      },
    },
    history: { minWidth: 0 },
    actions: {
      minWidth: 0,
      display: "grid",
      gap: "2",
    },
  },
});
