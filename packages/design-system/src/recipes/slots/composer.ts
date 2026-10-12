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
    "peek",
  ],
  base: {
    root: {
      containerType: "inline-size",
      containerName: "animic-composer",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      // 欄の切り替えは横スクロールの領域のため、内容の高さで行を確保する。
      gridTemplateRows: "auto max-content minmax(8rem, 1fr) auto auto",
      gap: "3",
      minHeight: 0,
      minWidth: 0,
      // 下端の編集欄では、入力欄の最低高さと間隔を詰めて生成の操作まで1画面に収める。
      _composerDocked: {
        gridTemplateRows: "auto max-content minmax(4.5rem, 1fr) auto auto",
        gap: "2",
      },
      // 背の低い画面では見出しを隠し、入力方法の切り替えを欄の切り替えの行の右端に重ねる。
      _composerDockedShort: {
        position: "relative",
        gridTemplateRows: "max-content minmax(4.5rem, 1fr) auto auto",
      },
    },
    // 見出しと入力方法の切り替えは、狭い幅でも同じ行に置く。
    header: {
      _composerDockedShort: {
        position: "absolute",
        insetBlockStart: "0",
        insetInlineEnd: "0",
        zIndex: 1,
      },
      display: "flex",
      flexWrap: "nowrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "3",
    },
    // 見出しは折り返さない。
    title: {
      minWidth: 0,
      flexShrink: 0,
      whiteSpace: "nowrap",
      _composerDockedShort: { display: "none" },
    },
    // 入力方法の切り替えは縮めず、見出しの右に置く。
    controls: { flexShrink: 0 },
    eyebrow: {
      textStyle: "eyebrow.strong",
      color: "accent.primary",
      _composerCompact: { display: "none" },
    },
    // 欄の切り替えは縮めず、入らなければ横にスクロールする。
    tabs: {
      minWidth: 0,
      overflowX: "auto",
      scrollbarWidth: "none",
      _composerDockedShort: {
        display: "grid",
        alignItems: "center",
        minHeight: "2.6rem",
        paddingInlineEnd: "6.5rem",
      },
    },
    input: { minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" },
    // 検索の2つの操作は横に並べる。
    tools: {
      display: "grid",
      gap: "2",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      "& > button": { whiteSpace: "nowrap", minWidth: 0 },
      // Buttonの高さは変数で詰める（Buttonの定義は個別の上書きより優先されるため）。
      _composerDocked: { "--animic-button-padding-block": "token(spacing.1)" },
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
      // 狭い画面では回数だけを出す（理由は操作の説明として読み上げに残る）。
      _composerCompact: { paddingInlineEnd: "0", "& > * > :first-child": { display: "none" } },
    },
    // 狭い画面ではショートカットの案内を出さない。
    action: {
      display: "grid",
      minWidth: 0,
      _composerCompact: { "--animic-button-trailing-icon-display": "none" },
      _composerDocked: {
        "--animic-button-min-height": "3rem",
        "--animic-button-padding-block": "token(spacing.2)",
      },
      _composerDockedShort: { "--animic-button-min-height": "2.75rem" },
    },
    peek: { display: "none", minWidth: 0 },
  },
  variants: {
    // 下端に畳んだ編集欄では、入力の要約と操作の行だけを出す。
    collapsed: {
      true: {
        root: { _composerDocked: { gridTemplateRows: "auto auto", gap: "2" } },
        header: { _composerDocked: { display: "none" } },
        tabs: { _composerDocked: { display: "none" } },
        input: { _composerDocked: { display: "none" } },
        tools: { _composerDocked: { display: "none" } },
        peek: {
          _composerDocked: {
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            "& > button": { justifyContent: "space-between" },
            "& [data-animic-button-label]": {
              flex: "1 1 auto",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "start",
            },
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: { collapsed: false },
});
