import { defineRecipe, defineSlotRecipe } from "@pandacss/dev";

// 対戦画面: 残り時間・お題・対戦状況・プロンプト・生成した画像

// 上部の残り時間と、その下の時間の帯
export const hud = defineSlotRecipe({
  className: "hud",
  description: "対戦中の上部。ルームの情報、中央の残り時間、相手の状況、時間の帯、生成終了後の案内",
  slots: [
    "left",
    "chip",
    "levelChip",
    "timer",
    "timerLabel",
    "timerNumber",
    "right",
    "track",
    "trackBar",
    "phase",
    "phaseStrong",
  ],
  base: {
    left: { display: "flex", alignItems: "center", gap: "4", minWidth: "0" },
    // ルームコード・条件・相手の状況の札
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      py: "0.3rem",
      px: "3",
      borderRadius: "control",
      bg: "bg.surface",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      fontSize: "0.8rem",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      "& code": { fontFamily: "mono", letterSpacing: "0.1em" },
      // 難易度と制限時間は水色の地
      "&[data-level]": { borderColor: "transparent", bg: "tint.cyan" },
    },
    // 難易度と制限時間は、狭い画面では出さない
    levelChip: { display: "inline-flex", mdDown: { display: "none" } },
    timer: { display: "grid", justifyItems: "center", lineHeight: "none" },
    timerLabel: {
      fontFamily: "latin",
      fontStyle: "italic",
      fontSize: "0.68rem",
      letterSpacing: "0.25em",
      color: "fg.muted",
    },
    timerNumber: {
      fontFamily: "display",
      fontSize: "clamp(2rem, 4vw, 2.8rem)",
      fontVariantNumeric: "tabular-nums",
      transitionProperty: "color",
      transitionDuration: "normal",
      // 残りわずか: ピンクにして脈打たせる
      "&[data-hurry]": { color: "accent.default", animation: "beat 1s ease-in-out infinite" },
    },
    right: { justifySelf: "end", mdDown: { display: "none" } },
    track: { position: "sticky", top: "0", zIndex: "5", height: "6px", bg: "grid.line" },
    trackBar: {
      display: "block",
      height: "full",
      width: "full",
      background: "linear-gradient(90deg, token(colors.info.default), token(colors.accent.brand))",
      transformOrigin: "left",
      transform: "scaleX(var(--progress, 1))",
      transition: "transform 0.25s linear",
    },
    // 生成終了後の案内
    phase: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.4rem 1rem",
      m: "0",
      py: "0.7rem",
      px: "4",
      bg: "warning.default",
      color: "fg.default",
      fontWeight: "bold",
      textAlign: "center",
    },
    phaseStrong: { fontFamily: "display", fontWeight: "regular", fontSize: "1.2rem" },
  },
});

// 本体の2列（お題・対戦状況 / プロンプト・生成した画像）
export const battleLayout = defineSlotRecipe({
  className: "battle-layout",
  description: "対戦画面の2列の配置。左にお題と状況、右に入力と画像",
  slots: ["root", "column"],
  base: {
    root: {
      position: "relative",
      zIndex: "raised",
      width: "min(100%, 76rem)",
      mx: "auto",
      pt: "clamp(1rem, 3vw, 1.75rem)",
      px: "4",
      pb: "12",
      display: "grid",
      gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.3fr)",
      gap: "5",
      alignItems: "start",
      mdDown: { gridTemplateColumns: "minmax(0, 1fr)" },
    },
    column: {
      display: "grid",
      gap: "5",
      // 狭い画面ではお題と状況を横に並べる
      "&[data-side]": {
        mdDown: { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", alignItems: "start" },
        smDown: { gridTemplateColumns: "minmax(0, 1fr)" },
      },
    },
  },
});

// パネルの見出しの行
export const panelHead = defineSlotRecipe({
  className: "panel-head",
  description: "パネルの見出しと、右端の補足や操作",
  slots: ["root", "title", "note"],
  base: {
    root: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "3" },
    title: { m: "0", fontFamily: "round", fontWeight: "heavy", fontSize: "1.15rem" },
    note: { color: "fg.muted", fontSize: "0.8rem" },
  },
});

// お題・提出画像の額縁
export const artFrame = defineSlotRecipe({
  className: "art-frame",
  description: "お題や提出画像を正方形の枠に入れる。左上にTHEMEなどの札を置ける",
  slots: ["figure", "image", "tag", "missing"],
  base: {
    figure: {
      position: "relative",
      m: "0",
      aspectRatio: "1",
      borderRadius: "md",
      overflow: "hidden",
      bg: "bg.surface",
    },
    image: { display: "block", width: "full", height: "full", objectFit: "cover" },
    tag: {
      position: "absolute",
      left: "0.7rem",
      top: "0.7rem",
      py: "0.2rem",
      px: "0.7rem",
      borderRadius: "control",
      bg: "bg.inverse",
      color: "fg.inverse",
      fontFamily: "latin",
      fontStyle: "italic",
      fontSize: "0.7rem",
      letterSpacing: "widest",
    },
    missing: {
      display: "grid",
      placeItems: "center",
      width: "full",
      height: "full",
      color: "fg.muted",
      fontWeight: "bold",
    },
  },
  variants: {
    variant: {
      // 対戦中のお題: 淡い縁
      topic: {
        figure: {
          borderWidth: "thick",
          borderStyle: "solid",
          borderColor: "border.default",
          smDown: { width: "min(100%, 13rem)", justifySelf: "center" },
        },
      },
      // 結果のお題: 紺の縁で少し傾ける
      topicResult: {
        figure: {
          borderWidth: "heavy",
          borderStyle: "solid",
          borderColor: "border.strong",
          borderRadius: "lg",
          rotate: "-2deg",
        },
      },
      // 結果の提出画像
      submission: { figure: { bg: "bg.sunken" } },
      // 未提出
      missing: {
        figure: {
          display: "grid",
          placeItems: "center",
          borderWidth: "thick",
          borderStyle: "dashed",
          borderColor: "border.default",
          bg: "bg.sunken",
        },
      },
      // 提出確認の窓
      confirm: {
        figure: {
          width: "11rem",
          mx: "auto",
          borderWidth: "3px",
          borderStyle: "solid",
          borderColor: "accent.brand",
        },
      },
    },
  },
  defaultVariants: { variant: "topic" },
});

// 対戦状況: 参加者ごとの行
export const versusList = defineSlotRecipe({
  className: "versus-list",
  description: "対戦している参加者の状況（成功した生成の回数・提出済みかどうか）",
  slots: ["list", "row", "name", "note", "state"],
  base: {
    list: { display: "grid", gap: "0.6rem", m: "0", p: "0", listStyle: "none" },
    row: {
      display: "grid",
      gridTemplateColumns: "2.4rem 1fr auto",
      alignItems: "center",
      gap: "0.7rem",
      py: "0.6rem",
      px: "3",
      borderRadius: "md",
      bg: "bg.sunken",
    },
    name: { minWidth: "0", fontWeight: "bold", fontSize: "0.92rem", overflowWrap: "anywhere" },
    note: { display: "block", fontWeight: "regular", fontSize: "0.75rem", color: "fg.muted" },
    state: {
      py: "0.25rem",
      px: "0.65rem",
      borderRadius: "control",
      bg: "bg.surface",
      fontSize: "0.72rem",
      fontWeight: "bold",
      color: "fg.muted",
      whiteSpace: "nowrap",
      "&[data-state='done']": { bg: "success.muted", color: "success.strong" },
      "&[data-state='working']": { bg: "accent.subtle", color: "accent.default" },
    },
  },
});

// プロンプトの入力: 文章・タグの切り替え、入力欄、よく使う表現、生成の操作
export const promptComposer = defineSlotRecipe({
  className: "prompt-composer",
  description: "プロンプトを入力して生成する部品。よく使う表現を選択肢から入れられる",
  slots: ["textarea", "chips", "chipRow", "chipLabel", "chip", "foot", "count", "countNumber"],
  base: {
    textarea: {
      width: "full",
      minHeight: "6.5rem",
      py: "0.9rem",
      px: "4",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "md",
      font: "inherit",
      fontSize: "md",
      lineHeight: "relaxed",
      color: "fg.default",
      bg: "bg.surface",
      resize: "vertical",
      outline: "none",
      _focus: { borderColor: "border.strong" },
      _placeholder: { color: "fg.subtle" },
      "&[data-tags]": { fontFamily: "mono", fontSize: "0.9rem" },
      _disabled: { bg: "bg.sunken", color: "fg.muted" },
    },
    chips: { display: "grid", gap: "2" },
    chipRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem" },
    chipLabel: {
      width: "3.4rem",
      fontSize: "0.72rem",
      fontWeight: "bold",
      color: "fg.muted",
      smDown: { width: "full" },
    },
    chip: {
      py: "0.3rem",
      px: "0.7rem",
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "control",
      bg: "bg.surface",
      font: "inherit",
      fontSize: "0.8rem",
      color: "fg.default",
      cursor: "pointer",
      transitionProperty: "border-color, background-color",
      transitionDuration: "fast",
      "&:hover:not(:disabled)": { borderColor: "accent.brand", bg: "accent.subtle" },
      _disabled: { color: "fg.subtle", cursor: "default" },
    },
    foot: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "4",
      "& > button": { minWidth: "12rem" },
      smDown: {
        flexDirection: "column",
        alignItems: "stretch",
        "& > button": { width: "full", minWidth: "0" },
      },
    },
    count: { fontSize: "0.85rem", color: "fg.muted" },
    countNumber: {
      fontFamily: "display",
      fontWeight: "regular",
      fontSize: "1.3rem",
      color: "fg.default",
    },
  },
});

// 生成した画像の一覧と、提出の操作
export const shotGrid = defineSlotRecipe({
  className: "shot-grid",
  description: "生成した画像を並べ、1枚を選んで提出する",
  slots: [
    "grid",
    "empty",
    "shot",
    "image",
    "number",
    "check",
    "pending",
    "failed",
    "submitRow",
    "submitNote",
  ],
  base: {
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))",
      gap: "3",
      m: "0",
      p: "0",
      listStyle: "none",
    },
    empty: {
      gridColumn: "1 / -1",
      p: "6",
      borderWidth: "thick",
      borderStyle: "dashed",
      borderColor: "border.default",
      borderRadius: "md",
      textAlign: "center",
      fontSize: "0.85rem",
      color: "fg.muted",
    },
    shot: {
      position: "relative",
      display: "block",
      width: "full",
      aspectRatio: "1",
      p: "0",
      borderWidth: "3px",
      borderStyle: "solid",
      borderColor: "transparent",
      borderRadius: "md",
      overflow: "hidden",
      bg: "bg.sunken",
      cursor: "pointer",
      boxShadow: "0 0 0 2px token(colors.border.default)",
      transitionProperty: "transform, box-shadow",
      transitionDuration: "fast",
      animation: "shot-in 0.45s token(easings.pop)",
      "&:hover:not(:disabled)": { transform: "translateY(-2px)" },
      _pressed: { borderColor: "accent.brand", boxShadow: "0 0 0 4px rgb(255 45 135 / 0.25)" },
      _disabled: { cursor: "default" },
    },
    image: { display: "block", width: "full", height: "full", objectFit: "cover" },
    number: {
      position: "absolute",
      left: "0.4rem",
      top: "0.4rem",
      py: "0.1rem",
      px: "2",
      borderRadius: "control",
      bg: "rgb(11 27 43 / 0.75)",
      color: "fg.inverse",
      fontFamily: "mono",
      fontSize: "0.7rem",
    },
    check: {
      position: "absolute",
      right: "0.4rem",
      top: "0.4rem",
      display: "none",
      placeItems: "center",
      width: "1.6rem",
      height: "1.6rem",
      borderRadius: "full",
      bg: "accent.brand",
      color: "fg.inverse",
      "[aria-pressed='true'] &": { display: "grid" },
    },
    // 生成中: きらめきを流す
    pending: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      alignContent: "center",
      gap: "2",
      aspectRatio: "1",
      borderRadius: "md",
      boxShadow: "0 0 0 2px token(colors.border.default)",
      color: "fg.muted",
      fontSize: "0.78rem",
      fontWeight: "bold",
      background:
        "linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.7) 50%, transparent 70%) 0 0 / 250% 100%, token(colors.bg.sunken)",
      animation: "shot-in 0.45s token(easings.pop), shimmer 1.2s linear infinite",
    },
    failed: {
      display: "grid",
      placeItems: "center",
      aspectRatio: "1",
      borderRadius: "md",
      bg: "bg.sunken",
      boxShadow: "0 0 0 2px token(colors.border.default)",
      color: "danger.default",
      fontSize: "0.78rem",
      fontWeight: "bold",
    },
    submitRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "4",
      "& > button": { minWidth: "14rem" },
      smDown: {
        flexDirection: "column",
        alignItems: "stretch",
        "& > button": { width: "full", minWidth: "0" },
      },
    },
    submitNote: { m: "0", fontSize: "0.8rem", color: "fg.muted" },
  },
});

// 画面全体を覆う待機の表示（提出しました・採点中）
export const screenOverlay = defineSlotRecipe({
  className: "screen-overlay",
  description: "提出後や採点中など、操作を止めて待つ間の表示。画面全体を暗く覆う",
  slots: ["root", "title", "sub", "spinner"],
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
    title: {
      m: "0",
      fontFamily: "display",
      fontWeight: "regular",
      fontSize: "clamp(1.8rem, 6vw, 2.8rem)",
      color: "warning.default",
    },
    sub: { m: "0", fontWeight: "bold" },
    spinner: { width: "2.4rem", height: "2.4rem", borderWidth: "4px" },
  },
});

// 操作を並べる行（結果の下など）
export const actionRow = defineRecipe({
  className: "action-row",
  description: "主な操作と副次的な操作を中央に横に並べる。狭い画面では縦に積む",
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "0.9rem",
    "& > *": { minWidth: "13rem", smDown: { width: "full" } },
  },
});
