import { defineSlotRecipe } from "@pandacss/dev";

// ルームを作る・参加する画面のカード（ログイン方法の選択と表示名の入力）
export const entryCard = defineSlotRecipe({
  className: "entry-card",
  description: "方眼の背景の中央に置く、ロゴ付きの白いカード。手順の切り替えで左右に入れ替わる",
  slots: [
    "page",
    "stage",
    "stageInner",
    "char",
    "charImage",
    "spark",
    "card",
    "logo",
    "title",
    "sub",
    "context",
    "providers",
    "divider",
    "terms",
  ],
  base: {
    page: {
      position: "relative",
      zIndex: "raised",
      minHeight: "100svh",
      display: "grid",
      placeItems: "center",
      pt: "20",
      px: "4",
      pb: "12",
      // スマホ: 下のシートのおおよその高さ（--sheet-h）からキャラの置き場所を決め、
      // ステップが変わってシートの高さが変わってもキャラが動かないようにする
      "@media (max-width: 560px)": {
        "--sheet-h": "440px",
        "--stage-h": "calc(100svh - var(--sheet-h) + 28px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        placeItems: "stretch",
        p: "0",
      },
    },
    // キャラを大きく見せる領域。ページ全体に敷いて、シートの裏まで絵と背景を続ける。
    // 斜めのストライプは上側の領域（幅100vw×--stage-h）を基準にpxで位置を決める（112degのグラデーション線の長さ = 0.927×幅 + 0.375×高さ）
    stage: {
      display: "none",
      "@media (max-width: 560px)": {
        "--gl": "calc(0.927 * 100vw + 0.375 * var(--stage-h))",
        position: "absolute",
        inset: "0",
        display: "block",
        overflow: "hidden",
        background:
          "linear-gradient(112deg, transparent 0 calc(0.58 * var(--gl)), token(colors.info.default) calc(0.58 * var(--gl)) calc(0.592 * var(--gl)), transparent calc(0.592 * var(--gl)) calc(0.61 * var(--gl)), token(colors.tint.pinkDeep) calc(0.61 * var(--gl)) calc(0.88 * var(--gl)), token(colors.warning.default) calc(0.88 * var(--gl)) calc(0.892 * var(--gl)), transparent calc(0.892 * var(--gl)))",
      },
    },
    // キャラと星を置く範囲。シートを除いた上側（シートに28pxもぐる）
    stageInner: {
      position: "absolute",
      top: "0",
      left: "0",
      right: "0",
      height: "var(--stage-h)",
      minHeight: "15rem",
    },
    // 下のシートを除いた高さに収まる大きさにする（低い画面では小さく）
    char: {
      position: "absolute",
      top: "calc(50% + 14px)",
      left: "50%",
      width: "min(116vw, 34rem, (100svh - var(--sheet-h)) * 1.75)",
      transform: "translate(-54%, -50%) rotate(-10deg)",
    },
    charImage: {
      display: "block",
      width: "full",
      height: "auto",
      filter:
        "drop-shadow(0.4rem 0.9rem 0 rgb(255 114 185 / 0.9)) drop-shadow(0 20px 24px rgb(255 45 135 / 0.18))",
      animation: "m-float 6s ease-in-out infinite",
      _motionReduce: { animation: "none" },
    },
    spark: {
      position: "absolute",
      width: "2.4rem",
      height: "auto",
      animation: "m-twinkle 2.8s ease-in-out infinite",
      animationDelay: "var(--d, 0s)",
      _motionReduce: { animation: "none" },
    },
    card: {
      width: "min(100%, 27rem)",
      p: "clamp(1.75rem, 5vw, 2.5rem)",
      bg: "bg.surface",
      borderRadius: "card",
      boxShadow: "elevated",
      display: "grid",
      gap: "5",
      // 画面遷移のあと、カードが下から弾んで現れ、中身が順に出てくる
      _entering: {
        animation: "card-rise 0.8s token(easings.rise) 0.6s both",
        "& > *": {
          animation: "item-rise 0.5s ease-out both",
          animationDelay: "calc(0.85s + var(--item-index, 0) * 0.07s)",
        },
        "& > :nth-child(1)": { "--item-index": "0" },
        "& > :nth-child(2)": { "--item-index": "1" },
        "& > :nth-child(3)": { "--item-index": "2" },
        "& > :nth-child(4)": { "--item-index": "3" },
        "& > :nth-child(5)": { "--item-index": "4" },
        "& > :nth-child(6)": { "--item-index": "5" },
        "& > :nth-child(7)": { "--item-index": "6" },
        "& > :nth-child(8)": { "--item-index": "7" },
        "& > :nth-child(9)": { "--item-index": "8" },
        "& > :nth-child(10)": { "--item-index": "9" },
      },
      // 手順の切り替え: 今のカードが左へ抜け、次のカードが右から入る
      "&[data-step='out']": { animation: "step-out 0.28s ease-in forwards" },
      "&[data-step='in']": { animation: "step-in 0.5s token(easings.rise) both" },
      "&[data-step='out'][data-back]": { animationName: "step-out-back" },
      "&[data-step='in'][data-back]": { animationName: "step-in-back" },
      // スマホ: 下のボトムシート。手順の切り替えは、シートの中身が下から入れ替わる動き
      "@media (max-width: 560px)": {
        position: "relative",
        zIndex: "2",
        width: "full",
        gap: "0.9rem",
        pt: "1.9rem",
        px: "4",
        pb: "max(16px, env(safe-area-inset-bottom, 0px))",
        borderRadius: "28px 28px 0 0",
        boxShadow: "0 -14px 34px -20px rgb(11 27 43 / 0.4)",
        // つまみ
        _before: {
          content: '""',
          position: "absolute",
          top: "0.7rem",
          left: "50%",
          width: "40px",
          height: "5px",
          ml: "-20px",
          borderRadius: "control",
          bg: "border.default",
        },
        "&[data-step='out'], &[data-step='out'][data-back]": {
          animation: "m-sheet-out 0.22s ease-in forwards",
        },
        "&[data-step='in'], &[data-step='in'][data-back]": {
          animation: "m-sheet-in 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1) both",
        },
      },
    },
    logo: {
      display: "block",
      width: "min(100%, 15rem)",
      height: "auto",
      mx: "auto",
      mb: "1",
      "@media (max-width: 560px)": { display: "none" },
    },
    title: {
      m: "0",
      textAlign: "center",
      textStyle: "heading.lg",
      "@media (max-width: 560px)": { fontSize: "1.45rem" },
    },
    sub: {
      mt: "-0.6rem",
      mb: "0.4rem",
      textAlign: "center",
      color: "fg.muted",
      fontSize: "0.92rem",
      "@media (max-width: 560px)": { mt: "-0.5rem", mb: "0.2rem", fontSize: "0.85rem" },
    },
    // 参加するルームなど、この画面の前提を示す帯
    context: {
      mt: "-0.4rem",
      py: "0.6rem",
      px: "0.9rem",
      borderRadius: "0.8rem",
      bg: "accent.subtle",
      textAlign: "center",
      fontSize: "0.85rem",
      "& code": { fontFamily: "mono", letterSpacing: "wider" },
    },
    providers: { display: "grid", gap: "3" },
    divider: {
      display: "flex",
      alignItems: "center",
      gap: "0.9rem",
      m: "0",
      color: "fg.muted",
      fontSize: "0.82rem",
      "&::before, &::after": { content: '""', flex: "1", height: "1px", bg: "border.default" },
    },
    terms: {
      mt: "1",
      pt: "4",
      borderTopWidth: "thin",
      borderTopStyle: "dashed",
      borderTopColor: "border.default",
      textAlign: "center",
      color: "fg.muted",
      fontSize: "0.75rem",
      lineHeight: "relaxed",
      "& a": { color: "fg.default", textDecoration: "underline" },
      "@media (max-width: 560px)": { mt: "0", pt: "0.8rem", fontSize: "0.78rem" },
    },
  },
  variants: {
    sparkAt: {
      topLeft: { spark: { left: "8%", top: "22%", "--d": "0s", color: "info.default" } },
      topRight: { spark: { right: "8%", top: "18%", "--d": "-1.1s", color: "warning.default" } },
      bottomLeft: { spark: { left: "16%", bottom: "20%", "--d": "-1.9s", color: "accent.muted" } },
    },
  },
});

// ログイン連携のボタンの両端: 左にアイコン、右に同じ幅の空き（文言をボタンの中央に置く）
export const providerButton = defineSlotRecipe({
  className: "provider-button",
  description:
    "ログイン連携先を選ぶボタンの両端。アイコンと空きの幅をそろえ、文言をボタンの中央に置く",
  slots: ["icon", "spacer"],
  base: {
    icon: { display: "grid", placeItems: "center", width: "1.5rem" },
    spacer: { display: "block", width: "1.5rem" },
  },
});
