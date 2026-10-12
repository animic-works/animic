import { defineSlotRecipe, defineStyles } from "@pandacss/dev";
import { focus } from "../control";
// 縦積みは「比較を横に置けない幅」か「高さのある中間幅」で選ぶ。
// 低い横長画面の条件と重ねず、生成CSSの順序でレイアウトが変わらないようにする。
const stackedHeader = defineStyles({
  height: "auto",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "2",
  padding: "0.2rem 0.875rem 0.7rem",
  background: "bg.surface",
});
const stackedBody = defineStyles({
  display: "flex",
  flexDirection: "column",
  padding: "0.625rem 0.875rem 1.5rem",
});
export const workspace = defineSlotRecipe({
  className: "workspace",
  slots: [
    "root",
    "layout",
    "header",
    "start",
    "detail",
    "inlineDetail",
    "center",
    "end",
    "progress",
    "body",
    "editor",
    "grip",
    "editorBody",
    "collapsed",
    "main",
  ],
  base: {
    collapsed: { display: "none" },
    root: { containerType: "inline-size", containerName: "animic-workspace", color: "fg.default" },
    layout: {
      display: "grid",
      gridTemplateRows: "auto auto minmax(0, 1fr)",
      // 1画面に収める。中身は本体の行の中で縮める（極端に低い画面だけページを伸ばす）。
      height: "max(100svh, 34rem)",
      minHeight: "max(100svh, 34rem)",
      _workspaceCompact: { minHeight: "100svh" },
      _workspaceDocked: { height: "100svh", minHeight: 0, background: "bg.surface" },
      _workspaceShort: { minHeight: "100svh" },
    },
    header: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
      alignItems: "center",
      gap: "6",
      minHeight: "4.75rem",
      paddingInline: "clamp(1rem, 3vw, 2rem)",
      _workspaceVertical: stackedHeader,
      _workspaceCompact: { _workspaceTall: stackedHeader },
      _workspaceLandscape: {
        _workspaceHorizontal: {
          gridTemplateColumns: "auto auto minmax(0, 1fr)",
          paddingBlock: "2",
          gap: "3",
        },
      },
    },
    detail: { _workspaceCompact: { display: "none" } },
    // 札の中の補足。狭い幅では省略し、ロゴと札を1行に収める。
    inlineDetail: { _workspaceNarrow: { display: "none" } },
    start: {
      display: "flex",
      alignItems: "center",
      gap: "3",
      minWidth: 0,
      flexWrap: "wrap",
      _workspaceCompact: { gap: "2" },
      "& img": {
        display: "block",
        width: "7.25rem",
        height: "auto",
        _workspaceNarrow: { width: "4.5rem" },
        _workspaceLandscape: { _workspaceHorizontal: { width: "4.8rem" } },
      },
    },
    center: {
      justifySelf: "center",
      minWidth: 0,
      _workspaceVertical: { justifySelf: "end" },
      _workspaceCompact: { _workspaceTall: { justifySelf: "end" } },
    },
    end: {
      minWidth: 0,
      _workspaceVertical: { gridColumn: "1 / -1" },
      _workspaceCompact: { _workspaceTall: { gridColumn: "1 / -1" } },
    },
    progress: { paddingInline: "clamp(1rem, 3vw, 1.75rem)", height: "0.5rem" },
    body: {
      display: "grid",
      gridTemplateColumns: "clamp(17rem, 25vw, 25rem) minmax(0, 1fr)",
      gap: "1.1rem",
      padding: "1.1rem clamp(1rem, 3vw, 1.75rem) 1.5rem",
      // 画面の高さに合わせて縮める（外枠の高さは`layout`で決める）。
      minHeight: "0",
      gridTemplateRows: "minmax(0, 1fr)",
      _workspaceShort: { minHeight: "0" },
      _workspaceCompact: { minHeight: "0", _workspaceTall: { _workspaceFlow: stackedBody } },
      _workspaceVertical: { minHeight: "0", _workspaceFlow: stackedBody },
      _workspaceDocked: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: "auto minmax(0, 1fr)",
        padding: "0",
        gap: "0",
      },
      _workspaceLandscape: {
        _workspaceHorizontal: {
          display: "grid",
          gridTemplateColumns: "minmax(17rem, 40%) minmax(0, 1fr)",
          padding: "0.5rem 0.875rem 1rem",
          gap: "2",
        },
      },
    },
    editor: {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      border: "2px solid token(colors.border.default)",
      borderRadius: "1.6rem",
      background: "bg.surface",
      boxShadow: "soft.1",
      padding: "1.1rem",
      _workspaceDocked: {
        position: "relative",
        gridRow: "2",
        minHeight: 0,
        zIndex: "navigation",
        borderBottom: "0",
        borderEndStartRadius: "0",
        borderEndEndRadius: "0",
        padding: "0.9rem 0.875rem max(0.75rem, env(safe-area-inset-bottom, 0px))",
        boxShadow: "0 -14px 34px -20px rgb(11 27 43 / 0.4)",
      },
      // 背の低い画面では、つまみの下の余白を詰める。
      _workspaceDockedShort: { paddingTop: "0.6rem" },
    },
    grip: {
      display: "none",
      _workspaceDocked: {
        display: "grid",
        placeItems: "center",
        width: "3rem",
        height: "1.5rem",
        position: "absolute",
        top: "-1px",
        left: "50%",
        translate: "-50% 0",
        border: "0",
        background: "transparent",
        touchAction: "none",
        cursor: "pointer",
        _focusVisible: focus,
        "&::after": {
          content: '""',
          width: "2.5rem",
          height: "5px",
          borderRadius: "full",
          background: "border.default",
        },
      },
    },
    editorBody: {
      overflowY: "auto",
      minHeight: 0,
      minWidth: 0,
      flex: "1 1 auto",
      display: "grid",
      _workspaceCompact: { _workspaceFlow: { overflowY: "visible" } },
      _workspaceDocked: { paddingTop: "2", overflowY: "auto" },
    },
    main: {
      minWidth: 0,
      minHeight: 0,
      display: "grid",
      _workspaceVertical: { order: -1 },
      _workspaceCompact: { _workspaceTall: { order: -1 } },
      _workspaceDocked: {
        gridRow: "1",
        padding: "0.625rem 0.875rem 0.5rem",
        alignContent: "start",
      },
      _workspaceDockedShort: { paddingTop: "0.375rem" },
    },
  },
  variants: {
    expanded: {
      // 畳んだ編集欄は内容の高さにし、空いた高さを比較の領域へ回す。
      // 編集欄の中身は、利用側が畳んだときの表示に切り替える（`collapsedContent`では差し替える）。
      false: {
        body: { _workspaceDocked: { gridTemplateRows: "minmax(0, 1fr) auto" } },
        editor: { _workspaceDocked: { height: "auto", minHeight: "0", paddingTop: "1.3rem" } },
        // 比較の領域の高さを測り、画像をその高さまで大きくして上から詰める。
        // 履歴は画像の下の1行に並べる（Comparisonが変数を読む）。
        main: {
          _workspaceDocked: {
            alignContent: "start",
            containerType: "size",
            "--animic-comparison-tools-columns": "minmax(0, 1fr)",
            "--animic-thumbnail-aspect": "13 / 19",
          },
          _workspaceDockedPhone: {
            // 画像の下の見出し・履歴・提出の操作と余白の分（約14.5rem）を引いた高さ。
            "--animic-comparison-media-block": "calc(100cqh - 14.5rem)",
            // 履歴は縦長の比率で一回り大きく並べる（ThumbnailListが変数を読む）。
            // 画像が幅で頭打ちになる縦長の画面では、残りの高さまで履歴を大きくする。
            "--animic-thumbnail-size":
              "clamp(4.25rem, calc((100cqh - (50cqw - 0.875rem - 5px) * 19 / 13 - 9rem) * 13 / 19), 6.5rem)",
          },
          // タブレットの比較欄は見出しと枠を持つため、その分も含めて約21remを引き、履歴は一定の大きさにする。
          _workspaceDockedTablet: {
            "--animic-comparison-media-block": "calc(100cqh - 21rem)",
            "--animic-thumbnail-size": "4.25rem",
          },
        },
      },
      true: {},
    },
    collapsedContent: { true: {}, false: {} },
    // 編集欄の面。`caution`は使わなくなった編集欄を、上下に黒の斜め縞を付けた黄色の面にする。
    editorTone: {
      default: {},
      caution: {
        editor: {
          borderColor:
            "color-mix(in srgb, token(colors.accent.highlight) 88%, token(colors.fg.accent.highlight))",
          background:
            "repeating-linear-gradient(-45deg, token(colors.fg.default) 0 14px, transparent 14px 28px) top / 100% 18px no-repeat, repeating-linear-gradient(-45deg, token(colors.fg.default) 0 14px, transparent 14px 28px) bottom / 100% 18px no-repeat, token(colors.accent.highlight)",
          color: "fg.default",
          animation: "cautionIn 550ms cubic-bezier(0.3, 1.6, 0.5, 1) both",
          _motionReduce: { animation: "none" },
          // 上下の縞（18px）に中身が掛からないよう余白を取る。
          _workspaceDocked: {
            paddingTop: "1.6rem",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
          },
        },
        // 縞の上でもつまみが見えるよう、つまみの線を白くする。
        grip: { "&::after": { background: "bg.surface" } },
      },
    },
  },
  compoundVariants: [
    {
      expanded: false,
      collapsedContent: true,
      css: {
        collapsed: { _workspaceDocked: { display: "grid" } },
        editorBody: { _workspaceDocked: { display: "none" } },
      },
    },
  ],
  defaultVariants: { expanded: true, collapsedContent: false, editorTone: "default" },
});
