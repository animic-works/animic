import { defineRecipe, defineSlotRecipe } from "@pandacss/dev";

// ロビー: ルームコード・参加者・対戦の条件・開始
// 画面の幅の区切り（画面モックと同じ値）。narrow: 1列に積み、開始ボタンを画面下に固定 / phone: アプリ風の画面
const narrow = "@media (max-width: 820px)";
const phone = "@media (max-width: 560px)";
const wide = "@media (min-width: 821px)";
// スマホの横向き: 縦に積むと長くなるので2カラムのままにし、開始ボタンも画面下に固定しない
const landscape = "@media (orientation: landscape) and (max-height: 500px)";

// 「退出」の文字のボタン（白地に紺の縁）
const leavePill = {
  py: "0.45rem",
  px: "1.1rem",
  borderWidth: "thick",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "control",
  bg: "bg.surface",
  color: "fg.default",
  fontFamily: "body",
  fontSize: "0.85rem",
  fontWeight: "bold",
  cursor: "pointer",
} as const;

// 上部のバー: 左にロゴ、右に操作。スマホのロビーでは、ロゴ・ルームコード・退出を1行に並べて上に貼り付く
export const topBar = defineSlotRecipe({
  className: "top-bar",
  description:
    "画面の上に置くバー。左にロゴ、右に退出などの操作や状況を置く。スマホのロビーでは中央にルームコードのチップを置く",
  slots: ["root", "logo", "side", "room", "roomLabel", "roomCode", "leave"],
  base: {
    root: {
      position: "relative",
      zIndex: "5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "4",
      pt: "4",
      px: "clamp(1rem, 4vw, 3rem)",
      pb: "0",
    },
    logo: { display: "block", width: "8rem", height: "auto" },
    side: { display: "flex", alignItems: "center", gap: "4", minWidth: "0" },
    // スマホだけ: ルームコードのチップ（押すとコピー）
    room: {
      display: "none",
      [phone]: {
        justifySelf: "center",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        minHeight: "40px",
        px: "0.85rem",
        borderWidth: "none",
        borderRadius: "control",
        bg: "bg.sunken",
        color: "fg.default",
        fontFamily: "body",
        cursor: "pointer",
      },
    },
    roomLabel: {
      whiteSpace: "nowrap",
      fontSize: "0.68rem",
      fontWeight: "bold",
      color: "fg.muted",
      "@media (max-width: 359px)": { display: "none" },
    },
    roomCode: {
      fontFamily: "mono",
      fontWeight: "bold",
      fontSize: "0.9rem",
      letterSpacing: "0.08em",
    },
    // バーの「退出」: 2列の広い画面では出さず（プレイヤーのカードの下に置く）、1列では文字のボタン、スマホではアイコンだけ
    leave: {
      display: "none",
      [narrow]: { display: "inline-flex", alignItems: "center", ...leavePill },
      "& [data-part='icon']": { display: "none" },
      [phone]: {
        display: "grid",
        placeItems: "center",
        width: "44px",
        height: "44px",
        mr: "-6px",
        p: "0",
        borderWidth: "none",
        bg: "none",
        "& [data-part='icon']": { display: "block" },
        "& [data-part='label']": {
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clipPath: "inset(50%)",
        },
      },
    },
  },
  variants: {
    variant: {
      plain: {
        root: {
          [phone]: {
            position: "sticky",
            top: "0",
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            gap: "2",
            minHeight: "calc(56px + env(safe-area-inset-top, 0px))",
            pt: "env(safe-area-inset-top, 0px)",
            px: "4",
            pb: "0",
            bg: "rgb(255 255 255 / 0.92)",
            borderBottomWidth: "thin",
            borderBottomStyle: "solid",
            borderBottomColor: "border.default",
            backdropFilter: "blur(10px)",
          },
        },
        logo: { [phone]: { width: "5.6rem" } },
      },
      // 対戦中: 上に貼り付き、方眼が透ける地の上に残り時間を中央に置く
      sticky: {
        root: {
          position: "sticky",
          top: "0",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          py: "0.7rem",
          px: "clamp(1rem, 4vw, 3rem)",
          bg: "bg.translucent",
          backdropFilter: "blur(8px)",
          [narrow]: { gridTemplateColumns: "1fr auto" },
        },
        logo: { width: "7.5rem", flex: "none", smDown: { width: "6rem" } },
      },
      // 結果: 少し余白を広く
      result: { root: { py: "0.9rem", px: "clamp(1rem, 4vw, 3rem)" } },
    },
  },
  defaultVariants: { variant: "plain" },
});

// ロビーの2列（プレイヤー・ルール）。狭い画面では縦に並べ、下に固定する開始ボタンの分を空ける
export const lobbyLayout = defineSlotRecipe({
  className: "lobby-layout",
  description: "ロビーの2列の配置。左にプレイヤー（広い画面ではその下に退出）、右にルールと開始",
  slots: ["root", "column", "leave"],
  base: {
    root: {
      position: "relative",
      zIndex: "raised",
      width: "min(100%, 72rem)",
      mx: "auto",
      pt: "clamp(1rem, 3vw, 2rem)",
      px: "4",
      pb: "12",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)",
      gap: "clamp(1.25rem, 3vw, 2rem) clamp(1.25rem, 2.5vw, 1.75rem)",
      alignItems: "start",
      [narrow]: {
        gridTemplateColumns: "minmax(0, 1fr)",
        pb: "calc(9rem + env(safe-area-inset-bottom, 0px))",
      },
      [phone]: {
        gap: "12px",
        pt: "12px",
        px: "4",
        pb: "calc(7rem + env(safe-area-inset-bottom, 0px))",
      },
      [landscape]: {
        gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
        gap: "4",
        pt: "3",
        px: "max(16px, env(safe-area-inset-left), env(safe-area-inset-right))",
        pb: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
      },
    },
    // プレイヤーのカードと、その下の退出
    column: { [wide]: { display: "grid", gap: "4" } },
    // 広い画面だけ: 退出はプレイヤーのカードの下に左寄せで置く
    leave: {
      display: "none",
      [wide]: { display: "inline-block", justifySelf: "start", ...leavePill },
    },
  },
});

// プレイヤーのカード: 上にルームコードと招待、その下に参加者の枠
export const playerBoard = defineSlotRecipe({
  className: "player-board",
  description:
    "ルームコード・招待・参加者の一覧。参加者が増えてもカードの大きさを変えない。スマホでは一覧の行にする",
  slots: [
    "head",
    "roomCard",
    "roomLabel",
    "codeCells",
    "codeChip",
    "codeChipText",
    "codeChipIcon",
    "titleRow",
    "title",
    "count",
    "countTotal",
    "grid",
    "slot",
    "player",
    "avatar",
    "name",
    "nameNote",
    "ready",
    "tag",
    "empty",
    "plus",
    "edit",
  ],
  base: {
    head: {
      display: "grid",
      gap: "4",
      pb: "1.1rem",
      borderBottomWidth: "thick",
      borderBottomStyle: "dashed",
      borderBottomColor: "border.default",
      [phone]: { pb: "4" },
    },
    // ルームコードは、下のプレイヤーの見出しと同じく左端にそろえる。スマホでは8マスの代わりにチップと招待を横に並べる
    roomCard: {
      justifySelf: "start",
      display: "grid",
      gridTemplateColumns: "auto auto",
      alignItems: "end",
      gap: "0.4rem 0.75rem",
      [narrow]: { width: "full", gridTemplateColumns: "minmax(0, 1fr)" },
      [phone]: {
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "stretch",
        gap: "2",
        "& > button": { minHeight: "52px", px: "4", borderRadius: "14px", fontSize: "0.9rem" },
      },
      "@media (max-width: 359px)": { gridTemplateColumns: "minmax(0, 1fr)" },
    },
    roomLabel: {
      gridColumn: "1 / -1",
      textStyle: "display.sm",
      color: "fg.default",
      [phone]: { fontSize: "1.1rem" },
    },
    // 8マスのコード（スマホでは出さない）
    codeCells: { display: "contents", [phone]: { display: "none" } },
    // スマホだけ: 1行のコードをタップでコピー
    codeChip: {
      display: "none",
      [phone]: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2",
        minWidth: "0",
        minHeight: "52px",
        px: "0.8rem",
        borderWidth: "thick",
        borderStyle: "dashed",
        borderColor: "border.default",
        borderRadius: "14px",
        bg: "bg.sunken",
        color: "fg.default",
        fontFamily: "body",
        cursor: "pointer",
        _active: { bg: "#eceef2" },
      },
    },
    codeChipText: {
      fontFamily: "mono",
      fontWeight: "bold",
      fontSize: "clamp(1rem, 5.4vw, 1.35rem)",
      letterSpacing: "0.12em",
      whiteSpace: "nowrap",
      overflow: "hidden",
    },
    codeChipIcon: { display: "inline-flex", flex: "none", color: "fg.muted" },
    titleRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem 1rem",
      [phone]: { flexWrap: "nowrap" },
    },
    title: { m: "0", textStyle: "display.sm", [phone]: { fontSize: "1.1rem" } },
    count: { textStyle: "display.sm", [phone]: { fontSize: "1.1rem" } },
    countTotal: { fontSize: "0.75em", color: "fg.faint" },
    // 最初から8人分（4列×2段）の高さを確保する。スマホでは縦の一覧にする
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "repeat(2, minmax(9.2rem, auto))",
      gap: "1rem 0.8rem",
      m: "0",
      pt: "0.6rem",
      pb: "0.2rem",
      listStyle: "none",
      [phone]: { display: "flex", flexDirection: "column", gap: "8px", p: "0" },
    },
    slot: { display: "grid" },
    player: {
      position: "relative",
      display: "grid",
      justifyItems: "center",
      alignContent: "start",
      gap: "0.3rem",
      pt: "1.05rem",
      px: "2",
      pb: "0.8rem",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "1.1rem",
      bg: "bg.surface",
      textAlign: "center",
      minHeight: "9.2rem",
      "&[data-me]": { borderColor: "accent.brand", boxShadow: "0 0 0 3px rgb(255 45 135 / 0.12)" },
      "&[data-joined]": { animation: "joined 0.5s token(easings.pop)" },
      // スマホ: アバター・名前・準備状況を並べた一覧の行
      [phone]: {
        gridTemplateColumns: "44px minmax(0, 1fr) auto",
        gridTemplateAreas: '"avatar name tag" "avatar ready tag"',
        justifyItems: "start",
        alignItems: "center",
        alignContent: "normal",
        gap: "0.1rem 0.8rem",
        minHeight: "64px",
        py: "10px",
        px: "12px",
        borderWidth: "1.5px",
        borderRadius: "16px",
        textAlign: "left",
        "&[data-me]": { bg: "#fff7fb", boxShadow: "none" },
        // 右端に「表示名を変更」のボタンを置く分だけ空ける
        "&[data-editable]": { pr: "56px" },
      },
    },
    avatar: {
      display: "contents",
      [phone]: {
        display: "block",
        gridArea: "avatar",
        "& > *": { width: "44px", height: "44px", fontSize: "1.1rem" },
      },
    },
    name: {
      maxWidth: "full",
      fontFamily: "round",
      fontWeight: "heavy",
      fontSize: "0.95rem",
      lineHeight: "1.3",
      overflowWrap: "anywhere",
      [phone]: { gridArea: "name", alignSelf: "end", fontSize: "md" },
    },
    nameNote: {
      fontSize: "smaller",
      [phone]: { whiteSpace: "nowrap", fontSize: "0.72rem", color: "fg.muted" },
    },
    // 自分の枠だけに出す「表示名を変更」（鉛筆）。広い画面では右上、スマホでは行の右端
    edit: {
      position: "absolute",
      top: "0.45rem",
      right: "0.45rem",
      display: "grid",
      placeItems: "center",
      width: "1.75rem",
      height: "1.75rem",
      p: "0",
      borderWidth: "thin",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "full",
      bg: "bg.surface",
      color: "fg.muted",
      cursor: "pointer",
      _hover: { borderColor: "accent.default", color: "accent.default" },
      [phone]: {
        top: "50%",
        right: "10px",
        width: "36px",
        height: "36px",
        borderWidth: "none",
        bg: "bg.sunken",
        translate: "0 -50%",
      },
    },
    ready: {
      mt: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      fontSize: "0.72rem",
      fontWeight: "bold",
      color: "fg.subtle",
      _before: {
        content: '""',
        width: "2",
        height: "2",
        borderRadius: "full",
        bg: "border.default",
      },
      "&[data-on]": { color: "success.strong", _before: { bg: "success.dot" } },
      [phone]: { gridArea: "ready", alignSelf: "start", m: "0" },
    },
    tag: {
      position: "absolute",
      top: "-0.75rem",
      left: "50%",
      py: "0.12rem",
      px: "0.55rem",
      borderRadius: "control",
      bg: "warning.default",
      color: "fg.default",
      fontSize: "0.66rem",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      translate: "-50% 0",
      "&[data-me]": { bg: "accent.default", color: "accent.fg" },
      [phone]: {
        position: "static",
        gridArea: "tag",
        py: "0.25rem",
        px: "0.7rem",
        fontSize: "0.72rem",
        translate: "none",
      },
    },
    // 空いている枠: 押すと招待の窓を開く
    empty: {
      display: "grid",
      justifyItems: "center",
      justifyContent: "center",
      alignContent: "center",
      gap: "0.3rem",
      width: "full",
      minHeight: "9.2rem",
      pt: "1.05rem",
      px: "2",
      pb: "0.8rem",
      borderWidth: "heavy",
      borderStyle: "dashed",
      borderColor: "accent.muted",
      borderRadius: "1.1rem",
      bg: "rgb(255 255 255 / 0.6)",
      color: "accent.default",
      fontFamily: "body",
      fontSize: "0.8rem",
      fontWeight: "bold",
      cursor: "pointer",
      [phone]: {
        gridTemplateColumns: "44px minmax(0, 1fr) auto",
        gridTemplateAreas: '"avatar name name"',
        justifyItems: "start",
        justifyContent: "normal",
        alignItems: "center",
        alignContent: "normal",
        gap: "0.1rem 0.8rem",
        minHeight: "60px",
        py: "10px",
        px: "12px",
        borderWidth: "thick",
        borderRadius: "16px",
        fontSize: "0.95rem",
        textAlign: "left",
      },
    },
    plus: {
      display: "grid",
      placeItems: "center",
      width: "2.6rem",
      height: "2.6rem",
      borderRadius: "full",
      borderWidth: "thick",
      borderStyle: "dashed",
      borderColor: "accent.muted",
      fontSize: "1.3rem",
      animation: "waiting 1.4s ease-in-out infinite",
      [phone]: { gridArea: "avatar", width: "44px", height: "44px" },
    },
  },
});

// 準備の状況（全員そろったら緑）。スマホでは下のバーの状況（goPanel の status）に替える
export const readyStatus = defineRecipe({
  className: "ready-status",
  description: "準備OKの人数。全員そろったら緑にする",
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    m: "0",
    py: "0.3rem",
    px: "0.85rem",
    borderRadius: "control",
    bg: "bg.sunken",
    fontSize: "0.82rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    _before: {
      content: '""',
      width: "0.55rem",
      height: "0.55rem",
      borderRadius: "full",
      bg: "border.default",
    },
    "& b": { fontFamily: "display", fontWeight: "regular", fontSize: "md" },
    [phone]: { display: "none" },
  },
  variants: {
    all: {
      true: { bg: "success.muted", color: "success.strong", _before: { bg: "success.dot" } },
      false: {},
    },
  },
  defaultVariants: { all: false },
});

// ルール: 項目名と選択肢（ホスト）または決まった内容（ゲスト）
export const rulesList = defineSlotRecipe({
  className: "rules-list",
  description: "難易度・制限時間などの条件の一覧。ホストは選択肢で決め、ゲストは文章で見る",
  slots: ["root", "row", "term", "value", "summary", "divider", "head", "title"],
  base: {
    root: { display: "grid", gap: "0.7rem", m: "0" },
    row: {
      display: "grid",
      gridTemplateColumns: "6.4rem minmax(0, 1fr)",
      alignItems: "center",
      gap: "3",
      "&[data-wide]": { gridTemplateColumns: "minmax(0, 1fr)" },
    },
    term: { fontSize: "0.85rem", fontWeight: "bold" },
    value: { m: "0", minWidth: "0" },
    summary: { fontFamily: "round", fontWeight: "heavy" },
    divider: {
      height: "0",
      my: "0.2rem",
      borderTopWidth: "thick",
      borderTopStyle: "dashed",
      borderTopColor: "border.default",
      [narrow]: { display: "none" },
      [landscape]: { display: "block" },
    },
    head: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "3" },
    title: { m: "0", textStyle: "display.sm", [phone]: { fontSize: "1.1rem" } },
  },
  variants: {
    mode: {
      // ホスト: スマホと横向きのスマホでは見出しを上、選択肢を下に
      edit: {
        root: { [phone]: { gap: "4" } },
        row: {
          [phone]: { gridTemplateColumns: "minmax(0, 1fr)", gap: "0.45rem" },
          [landscape]: { gridTemplateColumns: "minmax(0, 1fr)", gap: "0.4rem" },
        },
        term: {
          [phone]: { fontSize: "0.8rem", color: "fg.muted" },
          [landscape]: { fontSize: "0.8rem", color: "fg.muted" },
        },
      },
      // ゲスト: スマホでは項目名と内容を1行に並べ、線で区切る
      view: {
        row: {
          [phone]: {
            "&:not([data-wide])": {
              gridTemplateColumns: "minmax(0, 1fr) auto",
              minHeight: "44px",
              borderBottomWidth: "thin",
              borderBottomStyle: "solid",
              borderBottomColor: "border.default",
            },
            "&:last-child": { borderBottomWidth: "none" },
          },
        },
        term: { [phone]: { fontSize: "0.8rem", color: "fg.muted" } },
      },
    },
  },
  defaultVariants: { mode: "edit" },
});

// 並べた選択肢から1つ選ぶ（Ark UIのRadioGroupに対応づける）
export const segmentedControl = defineSlotRecipe({
  className: "segmented",
  description: "少ない選択肢（4つ以下）から1つ選ぶ。選んだものを濃く塗る",
  slots: ["root", "item", "itemText"],
  base: {
    root: {
      display: "grid",
      gridAutoFlow: "column",
      gridAutoColumns: "1fr",
      p: "1",
      borderRadius: "control",
      bg: "bg.sunken",
    },
    item: {
      position: "relative",
      display: "block",
      py: "2",
      px: "0.3rem",
      borderRadius: "control",
      textAlign: "center",
      fontSize: "0.85rem",
      fontWeight: "bold",
      color: "fg.muted",
      cursor: "pointer",
      whiteSpace: "nowrap",
      _checked: { bg: "bg.inverse", color: "fg.inverse" },
      _disabled: { cursor: "default" },
      "&:has(:focus-visible)": {
        outlineWidth: "3px",
        outlineStyle: "solid",
        outlineColor: "focus.ring",
        outlineOffset: "2px",
      },
    },
    itemText: {},
  },
  variants: {
    tone: {
      neutral: {},
      // 難易度はピンクで塗る
      accent: { item: { _checked: { bg: "accent.default" } } },
    },
    variant: {
      // ロビーの条件: スマホでは48px近い高さで押しやすく
      fill: {
        root: { [phone]: { p: "4px" } },
        item: {
          [phone]: {
            display: "grid",
            placeItems: "center",
            minHeight: "40px",
            py: "0",
            px: "0.2rem",
            fontSize: "0.9rem",
          },
        },
      },
      // 対戦画面の入力方法の切り替え: 選んだものを白く浮かせる
      lift: {
        root: { gridAutoColumns: "auto", p: "0.2rem" },
        item: {
          py: "0.35rem",
          px: "0.9rem",
          fontSize: "0.8rem",
          _checked: {
            bg: "bg.surface",
            color: "fg.default",
            boxShadow: "0 2px 8px rgb(11 27 43 / 0.12)",
          },
        },
      },
    },
  },
  defaultVariants: { tone: "neutral", variant: "fill" },
});

// 難易度の挿絵: ルール欄の幅いっぱいの正方形。画像の下端に濃い色のすりガラスの帯を敷き、
// 英字の小見出し → 難易度の英語（輪郭線だけの大きな文字）→ 条件の順に白文字を重ねる
export const levelArt = defineSlotRecipe({
  className: "level-art",
  description:
    "難易度の条件を表す挿絵。選んでいる難易度の画像だけを見せ、下端の帯に英語の見出しと条件を重ねる",
  slots: ["figure", "image", "tag", "cap", "word", "extra", "desc", "descPart"],
  base: {
    figure: {
      // 文字の大きさを枠の幅に、帯のぼかしの高さを枠の高さに連動させる
      containerType: "size",
      position: "relative",
      width: "full",
      maxHeight: "24rem",
      m: "0",
      aspectRatio: "1",
      overflow: "hidden",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "md",
      bg: "bg.sunken",
      [phone]: { mt: "0.2rem" },
    },
    // サンプル画像は縦長（832×1216）なので、顔が入るように上寄りで切り取る
    image: {
      display: "block",
      width: "full",
      height: "full",
      objectFit: "cover",
      objectPosition: "50% 15%",
      "&[hidden]": { display: "none" },
    },
    // 左上の小さなタグ（結果画面のお題タグと同じ見た目）
    tag: {
      position: "absolute",
      zIndex: "raised",
      top: "3",
      left: "3",
      py: "0.25rem",
      px: "0.7rem",
      borderRadius: "control",
      bg: "rgb(11 27 43 / 0.72)",
      backdropFilter: "blur(8px)",
      color: "fg.inverse",
      fontFamily: "latin",
      fontStyle: "italic",
      fontWeight: "regular",
      fontSize: "0.62rem",
      letterSpacing: "0.22em",
    },
    // 帯の上端はマスクでぼかして、絵になじませる。
    // ぼかしは backdrop-filter ではなく、::before に置いた同じ画像（--level-art-image）を filter でぼかす。
    // backdrop-filter と mask-image を同じ要素に使うと、先祖が transform で動いている間（ロビーの entrance）
    // Chromium がマスクを落とし、帯が硬い長方形で出てからぼけた帯に切り替わるため
    cap: {
      position: "absolute",
      zIndex: "raised",
      inset: "auto 0 0",
      display: "grid",
      gap: "0.35rem",
      pt: "16",
      px: "4",
      pb: "4",
      WebkitMaskImage:
        "linear-gradient(to top, #000 32%, rgb(0 0 0 / 0.78) 50%, rgb(0 0 0 / 0.42) 70%, rgb(0 0 0 / 0.14) 88%, transparent)",
      maskImage:
        "linear-gradient(to top, #000 32%, rgb(0 0 0 / 0.78) 50%, rgb(0 0 0 / 0.42) 70%, rgb(0 0 0 / 0.14) 88%, transparent)",
      color: "fg.inverse",
      // 挿絵と同じ位置・大きさ（枠の高さいっぱい、上寄りで切り取り）に重ねた、ぼかしたコピー
      _before: {
        content: '""',
        position: "absolute",
        left: "0",
        right: "0",
        bottom: "0",
        height: "100cqh",
        backgroundImage: "var(--level-art-image)",
        backgroundPosition: "50% 15%",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        filter: "blur(14px)",
        pointerEvents: "none",
      },
      _after: {
        content: '""',
        position: "absolute",
        inset: "0",
        background:
          "linear-gradient(to top, rgb(11 27 43 / 0.9), rgb(11 27 43 / 0.72) 40%, rgb(11 27 43 / 0.45))",
        pointerEvents: "none",
      },
    },
    // 難易度の英語: 白い輪郭線だけの大きな文字（枠の幅の9%。デスクトップで約2.1rem）
    word: {
      position: "relative",
      zIndex: "raised",
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      fontFamily: "display",
      fontSize: "clamp(1.7rem, 9cqi, 2.2rem)",
      lineHeight: "none",
      letterSpacing: "0.04em",
      color: "transparent",
      WebkitTextStroke: "1.5px rgb(255 255 255 / 0.85)",
      paintOrder: "stroke fill",
    },
    // EXTRA は黄色いステッカー風に、少し傾けて英語の横に添える
    extra: {
      py: "0.18rem",
      px: "0.65rem",
      borderRadius: "control",
      bg: "warning.default",
      color: "fg.default",
      WebkitTextStroke: "0",
      fontFamily: "latin",
      fontStyle: "italic",
      fontWeight: "regular",
      fontSize: "0.72rem",
      letterSpacing: "0.15em",
      rotate: "-4deg",
    },
    // 日本語の説明: 白文字にピンクの落ち影。条件は細い線で区切る
    desc: {
      position: "relative",
      zIndex: "raised",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      m: "0",
      fontFamily: "round",
      fontWeight: "heavy",
      fontSize: "clamp(1.05rem, 5.4cqi, 1.3rem)",
      lineHeight: "1.3",
      textShadow: "0 2px 0 token(colors.accent.brand)",
    },
    descPart: {
      "& + &": {
        ml: "0.7rem",
        pl: "0.7rem",
        borderLeftWidth: "thick",
        borderLeftStyle: "solid",
        borderLeftColor: "rgb(255 255 255 / 0.5)",
      },
    },
  },
});

// 開始の操作。狭い画面では画面の下に固定し、スマホでは準備状況と開始ボタンを横に並べたバーにする
export const goPanel = defineSlotRecipe({
  className: "go-panel",
  description:
    "対戦をはじめる・準備完了にするボタンと補足。狭い画面では画面の下に固定し、スマホでは準備状況を添える",
  slots: ["root", "status", "note"],
  base: {
    root: {
      display: "grid",
      gap: "0.7rem",
      [narrow]: {
        position: "fixed",
        zIndex: "6",
        left: "0",
        right: "0",
        bottom: "0",
        gridTemplateColumns: "minmax(0, 1fr)",
        alignItems: "center",
        gap: "0.4rem",
        pt: "3",
        px: "4",
        pb: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        bg: "bg.surface",
        borderTopWidth: "thin",
        borderTopStyle: "solid",
        borderTopColor: "border.default",
        boxShadow: "0 -12px 30px -22px rgb(11 27 43 / 0.45)",
        "& > button": { px: "2", fontSize: "0.95rem" },
      },
      [phone]: {
        gridTemplateColumns: "auto minmax(0, 1fr)",
        gap: "3",
        pt: "12px",
        px: "4",
        pb: "max(12px, env(safe-area-inset-bottom, 0px))",
        borderTopWidth: "none",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -10px 30px -18px rgb(11 27 43 / 0.4)",
        "& > button": { minHeight: "56px", py: "0", fontSize: "md" },
        "& > .button--variant_primary:not(:disabled)": {
          boxShadow: "0 10px 22px -10px rgb(255 45 135 / 0.7)",
        },
      },
      [landscape]: {
        position: "static",
        p: "0",
        bg: "none",
        borderTopWidth: "none",
        boxShadow: "none",
      },
    },
    // スマホだけ: 準備OKの人数
    status: {
      display: "none",
      [phone]: {
        display: "grid",
        justifyItems: "center",
        gap: "0.05rem",
        m: "0",
        minWidth: "4.5rem",
        py: "0.35rem",
        px: "0.7rem",
        borderRadius: "14px",
        bg: "bg.sunken",
        fontSize: "0.68rem",
        fontWeight: "bold",
        color: "fg.muted",
        lineHeight: "1.3",
        "& b": {
          fontFamily: "display",
          fontWeight: "regular",
          fontSize: "1.05rem",
          color: "fg.default",
        },
        "&[data-all]": {
          bg: "success.muted",
          color: "success.strong",
          "& b": { color: "success.strong" },
        },
      },
      [landscape]: { display: "none" },
    },
    note: {
      m: "0",
      textAlign: "center",
      fontSize: "0.78rem",
      color: "fg.muted",
      _empty: { display: "none" },
      [narrow]: { display: "none" },
      [landscape]: { display: "block" },
    },
  },
});

// 開始の確認: 準備中の人の一覧
export const waitingList = defineSlotRecipe({
  className: "waiting-list",
  description: "開始の確認の窓に出す、準備中の参加者の一覧",
  slots: ["list", "item", "note"],
  base: {
    list: {
      display: "grid",
      gap: "0.4rem",
      maxHeight: "12rem",
      m: "0",
      p: "0",
      overflowY: "auto",
      listStyle: "none",
    },
    item: {
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      py: "0.45rem",
      pr: "3",
      pl: "0.45rem",
      borderRadius: "control",
      bg: "bg.sunken",
      fontWeight: "bold",
    },
    note: { ml: "auto", color: "fg.muted", fontSize: "0.8rem" },
  },
});

// 招待の窓: URL・コード・QRコード
export const inviteCard = defineSlotRecipe({
  className: "invite-card",
  description: "友だちを招待する手段をまとめた窓の中身",
  slots: ["row", "url", "qr", "qrPattern"],
  base: {
    row: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "2", width: "full" },
    url: {
      width: "full",
      minWidth: "0",
      py: "0.65rem",
      px: "0.9rem",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "0.8rem",
      bg: "bg.sunken",
      fontFamily: "mono",
      fontSize: "0.8rem",
      color: "fg.muted",
      textAlign: "center",
    },
    qr: {
      width: "9.5rem",
      height: "9.5rem",
      p: "0.6rem",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "md",
      bg: "bg.surface",
      mx: "auto",
    },
    qrPattern: { width: "full", height: "full", fill: "fg.default" },
  },
});

// カウントダウン: 画面全体を暗くして数字を大きく出す
export const countdownOverlay = defineSlotRecipe({
  className: "countdown",
  description: "対戦開始までのカウントダウン。画面全体を覆い、数字を黄色で大きく見せる",
  slots: ["root", "label", "number", "sub"],
  base: {
    root: {
      position: "fixed",
      inset: "0",
      zIndex: "overlay",
      display: "grid",
      placeItems: "center",
      alignContent: "center",
      gap: "4",
      p: "4",
      bg: "bg.scrim",
      color: "fg.inverse",
      textAlign: "center",
    },
    label: {
      m: "0",
      py: "0.35rem",
      px: "4",
      borderRadius: "control",
      bg: "rgb(255 255 255 / 0.12)",
      fontWeight: "bold",
    },
    number: {
      fontFamily: "display",
      fontSize: "clamp(6rem, 30vw, 12rem)",
      lineHeight: "none",
      color: "warning.default",
      animation: "count-pop 0.9s ease-out",
      "&[data-start]": { fontSize: "clamp(3.5rem, 16vw, 7rem)" },
    },
    sub: { m: "0", fontWeight: "bold" },
  },
});
