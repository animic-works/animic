import { defineRecipe, defineSlotRecipe } from "@pandacss/dev";

// トップ（LP）の部品。ホーム・遊び方・採点方法・ギャラリーを縦に並べ、スクロールすると画面ごとに吸い付く
// 「遊び方」の白い帯の斜めの高さ。ヒーローの背景の帯もここまで伸ばす
const slant = "clamp(2.5rem, 7vw, 6rem)";
const sideGutter = "clamp(1.25rem, 6vw, 6.5rem)";
const navGap = "clamp(1rem, 3.5vw, 3.5rem)";
// 画面の幅・高さの区切り（画面モックと同じ値）
const phone = "@media (max-width: 560px)";
const phoneLow = "@media (max-width: 560px) and (max-height: 740px)";
const phoneShort = "@media (max-width: 560px) and (max-height: 700px)";
const phoneShorter = "@media (max-width: 560px) and (max-height: 600px)";
// 最も狭いスマホ（iPhone SE 1世代の320pxなど）
const phoneNarrow = "@media (max-width: 359px)";
const narrow = "@media (max-width: 900px)";
const wide = "@media (min-width: 901px)";
const wideShort = "@media (min-width: 901px) and (max-height: 800px)";
const upToLaptop = "@media (max-width: 1100px)";
const tabletPortrait =
  "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)";
// 淡い縁とやわらかい影のカード（対戦画面・ロビーと同じ）
const soft = {
  bg: "bg.surface",
  borderWidth: "thick",
  borderStyle: "solid",
  borderColor: "border.default",
  boxShadow: "surface",
} as const;
// 絵の上に乗せる数字の白いフチ（白い影を文字のまわり一周に重ねる）と影
const outline = [
  "2px 0 0 #fff",
  "1.4px 1.4px 0 #fff",
  "0 2px 0 #fff",
  "-1.4px 1.4px 0 #fff",
  "-2px 0 0 #fff",
  "-1.4px -1.4px 0 #fff",
  "0 -2px 0 #fff",
  "1.4px -1.4px 0 #fff",
  "4px 0 0 #fff",
  "3.7px 1.5px 0 #fff",
  "2.8px 2.8px 0 #fff",
  "1.5px 3.7px 0 #fff",
  "0 4px 0 #fff",
  "-1.5px 3.7px 0 #fff",
  "-2.8px 2.8px 0 #fff",
  "-3.7px 1.5px 0 #fff",
  "-4px 0 0 #fff",
  "-3.7px -1.5px 0 #fff",
  "-2.8px -2.8px 0 #fff",
  "-1.5px -3.7px 0 #fff",
  "0 -4px 0 #fff",
  "1.5px -3.7px 0 #fff",
  "2.8px -2.8px 0 #fff",
  "3.7px -1.5px 0 #fff",
  "0 5px 10px rgb(11 27 43 / 0.3)",
].join(", ");
// 淡い色に斜めの縞を重ねた地（遊び方の挿絵・ギャラリーの画像の代わり）
const stripes = (width: string, gap: string) =>
  `repeating-linear-gradient(-18deg, transparent 0 ${width}, rgb(255 255 255 / 0.55) ${width} ${gap}), var(--tint)`;

// 右上のナビ。表示中の画面を示す下線（indicator）が横へ移動する
export const landingNav = defineSlotRecipe({
  className: "landing-nav",
  description:
    "トップの右上に固定するメインメニュー。右端に「スタート」「ルームに参加」「ログイン」を置く。スマホでは上のバー（appBar）に替える",
  slots: ["root", "link", "cta", "account", "login", "indicator"],
  base: {
    root: {
      position: "fixed",
      top: "0",
      right: "0",
      zIndex: "sticky",
      display: "flex",
      alignItems: "center",
      gap: navGap,
      py: "1.4rem",
      px: "clamp(1.25rem, 4vw, 4.5rem)",
      bg: "bg.surface",
      borderBottomLeftRadius: "1.5rem",
      boxShadow: "bar",
      [narrow]: {
        left: "0",
        justifyContent: "center",
        borderRadius: "0 0 1.25rem 1.25rem",
        overflowX: "auto",
      },
      [phone]: { display: "none" },
    },
    link: {
      position: "relative",
      py: "2",
      color: "fg.default",
      fontWeight: "bold",
      fontSize: "0.95rem",
      letterSpacing: "wide",
      textDecoration: "none",
      whiteSpace: "nowrap",
      transitionProperty: "color",
      transitionDuration: "normal",
      _focusVisible: { outlineOffset: "4px" },
      "&:not([aria-current]):hover": { color: "accent.default" },
      // JavaScriptが動かない場合は、下線を各リンクに直接付ける
      _plain: {
        "&[aria-current='page']::after": {
          content: '""',
          position: "absolute",
          inset: "auto 0 0",
          height: "3px",
          borderRadius: "3px",
          bg: "accent.default",
        },
      },
    },
    // ナビの中で目立たせる「スタート」「ルームに参加」（スマホの上のバーと同じ見た目）
    cta: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.45rem",
      py: "0.55rem",
      px: "1.2rem",
      borderRadius: "control",
      bg: "accent.default",
      color: "accent.fg",
      fontWeight: "bold",
      fontSize: "0.95rem",
      letterSpacing: "wide",
      textDecoration: "none",
      whiteSpace: "nowrap",
      boxShadow: "glowSoft",
      transitionProperty: "transform",
      transitionDuration: "fast",
      _hover: { transform: "translateY(-2px)" },
      _focusVisible: { outlineOffset: "4px" },
    },
    // 右端のアカウント: 細い区切り線のあとに置く
    account: {
      position: "relative",
      display: "inline-flex",
      ml: `calc(0.4rem - ${navGap} / 2)`,
      pl: `calc(${navGap} / 2)`,
      borderLeftWidth: "thick",
      borderLeftStyle: "solid",
      borderLeftColor: "border.default",
    },
    // ゲストに見せる「ログイン」。幅の狭いバーでは人のアイコンだけ（compact）
    login: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      height: "10",
      px: "0.95rem",
      borderWidth: "none",
      borderRadius: "control",
      bg: "rgb(11 27 43 / 0.06)",
      color: "fg.default",
      fontFamily: "body",
      fontSize: "0.85rem",
      fontWeight: "bold",
      letterSpacing: "wide",
      whiteSpace: "nowrap",
      cursor: "pointer",
      transitionProperty: "background-color",
      transitionDuration: "fast",
      _hover: { bg: "rgb(11 27 43 / 0.12)" },
      "&[data-compact]": {
        width: "10",
        px: "0",
        justifyContent: "center",
        "& span": { display: "none" },
      },
    },
    indicator: {
      position: "absolute",
      left: "var(--nav-indicator-left, 0)",
      top: "var(--nav-indicator-top, 0)",
      width: "var(--nav-indicator-width, 0)",
      height: "3px",
      opacity: "var(--nav-indicator-opacity, 0)",
      borderRadius: "3px",
      bg: "accent.default",
      pointerEvents: "none",
      transition:
        "left 0.5s token(easings.sweep), width 0.5s token(easings.sweep), top 0.5s token(easings.sweep), opacity 0.3s",
      _plain: { display: "none" },
    },
  },
  variants: {
    // 「スタート」はピンク、「ルームに参加」は白地に縁
    cta: {
      start: {},
      join: {
        cta: {
          ml: `calc(0.6rem - ${navGap})`,
          bg: "bg.surface",
          color: "fg.default",
          boxShadow: "inset 0 0 0 2px currentColor",
        },
      },
    },
  },
  defaultVariants: { cta: "start" },
});

// スマホの上のバー: ホーム以外の画面で上から降りてくる。小さなロゴと「スタート」「参加」「ログイン」
export const appBar = defineSlotRecipe({
  className: "app-bar",
  description: "スマホのトップで、ホーム以外の画面の上に固定するバー。広い画面では出さない",
  slots: ["root", "logo", "actions", "start", "join", "joinLabel", "joinLong", "account"],
  base: {
    root: {
      display: "none",
      "--appbar-h": "calc(56px + env(safe-area-inset-top))",
      [phone]: {
        position: "fixed",
        inset: "0 0 auto",
        zIndex: "sticky",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2",
        height: "var(--appbar-h)",
        pt: "env(safe-area-inset-top)",
        px: "4",
        pb: "0",
        bg: "rgb(255 255 255 / 0.92)",
        backdropFilter: "blur(10px)",
        borderRadius: "0 0 20px 20px",
        boxShadow: "0 8px 24px -16px rgb(11 27 43 / 0.35)",
        transform: "translateY(-110%)",
        visibility: "hidden",
        transition: "transform 0.35s token(easings.standard), visibility 0s linear 0.35s",
        "&[data-shown]": {
          transform: "none",
          visibility: "visible",
          transition: "transform 0.35s token(easings.standard)",
        },
        _motionReduce: { transition: "none" },
      },
    },
    // ロゴは残りの幅に収める（iPhone SEの375pxなど、ボタンの分を引くと狭くなる画面では小さくする）
    logo: {
      display: "grid",
      alignItems: "center",
      flex: "1 1 0",
      minWidth: "0",
      minHeight: "48px",
      "& img": { display: "block", maxWidth: "full", height: "auto", maxHeight: "30px" },
      _focusVisible: { outlineOffset: "2px", borderRadius: "12px" },
    },
    actions: { display: "flex", flexShrink: "0", gap: "2" },
    start: {
      position: "relative",
      display: "inline-flex",
      flexShrink: "0",
      alignItems: "center",
      gap: "0.4rem",
      height: "40px",
      px: "4",
      whiteSpace: "nowrap",
      borderWidth: "none",
      borderRadius: "control",
      bg: "accent.default",
      color: "accent.fg",
      fontFamily: "body",
      fontSize: "0.85rem",
      fontWeight: "bold",
      letterSpacing: "wide",
      boxShadow: "0 6px 14px -6px rgb(255 45 135 / 0.7)",
      cursor: "pointer",
      // 見た目より広く押せるようにする
      _before: { content: '""', position: "absolute", inset: "-4px -2px" },
      _focusVisible: { outlineOffset: "2px", borderRadius: "12px" },
    },
    join: {
      position: "relative",
      display: "inline-flex",
      flexShrink: "0",
      alignItems: "center",
      gap: "0.4rem",
      height: "40px",
      px: "0.85rem",
      whiteSpace: "nowrap",
      borderWidth: "none",
      borderRadius: "control",
      bg: "bg.surface",
      color: "fg.default",
      fontFamily: "body",
      fontSize: "0.85rem",
      fontWeight: "bold",
      letterSpacing: "wide",
      boxShadow: "inset 0 0 0 2px currentColor",
      cursor: "pointer",
      _before: { content: '""', position: "absolute", inset: "-4px -2px" },
      _focusVisible: { outlineOffset: "2px", borderRadius: "12px" },
    },
    // 横幅が足りない画面では「参加」だけにし、最も狭い画面ではアイコンだけにする（名前はaria-labelで読む）
    joinLabel: { [phoneNarrow]: { display: "none" } },
    joinLong: { display: "none", "@media (min-width: 430px)": { display: "inline" } },
    account: { display: "inline-flex" },
  },
});

// 左上のロゴ: ホーム以外の画面で表示し、ナビの「ホーム」と同じくホームへ戻る
export const cornerLogo = defineRecipe({
  className: "corner-logo",
  description: "トップの左上に固定する小さなロゴ。ホーム以外の画面でだけ見せる",
  base: {
    position: "fixed",
    zIndex: "sticky",
    top: "1.1rem",
    left: "clamp(1.25rem, 4vw, 3rem)",
    display: "block",
    opacity: "0",
    visibility: "hidden",
    transform: "translateY(-1rem) rotate(-4deg)",
    transition: "opacity 0.4s ease, transform 0.5s token(easings.pop), visibility 0s linear 0.5s",
    _focusVisible: { outlineOffset: "4px", borderRadius: "sm" },
    "& img": {
      display: "block",
      width: "clamp(8rem, 12vw, 11rem)",
      height: "auto",
      transitionProperty: "transform",
      transitionDuration: "fast",
    },
    "&:hover img": { transform: "rotate(-3deg) scale(1.04)" },
    [narrow]: { display: "none" },
  },
  variants: {
    shown: {
      true: {
        opacity: "1",
        visibility: "visible",
        transform: "none",
        transition: "opacity 0.4s ease 0.1s, transform 0.5s token(easings.pop) 0.1s",
      },
      false: {},
    },
  },
  defaultVariants: { shown: false },
});

// 右端の現在位置
export const pager = defineSlotRecipe({
  className: "pager",
  description: "トップの右端に固定する現在位置。表示中の画面の点が縦に伸びる",
  slots: ["root", "dot"],
  base: {
    root: {
      position: "fixed",
      zIndex: "sticky",
      top: "50%",
      right: "clamp(0.75rem, 1.6vw, 1.5rem)",
      display: "grid",
      gap: "0.6rem",
      m: "0",
      py: "0.6rem",
      px: "0.45rem",
      listStyle: "none",
      borderRadius: "control",
      bg: "bg.surface",
      boxShadow: "pager",
      translate: "0 -50%",
      _plain: { display: "none" },
      [narrow]: { display: "none" },
    },
    dot: {
      display: "block",
      width: "0.7rem",
      height: "0.7rem",
      p: "0",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.strong",
      borderRadius: "control",
      bg: "bg.surface",
      cursor: "pointer",
      transition: "height 0.4s token(easings.sweep), background 0.3s, border-color 0.3s",
      "&[aria-current='true']": {
        height: "8",
        borderColor: "accent.default",
        bg: "accent.default",
      },
      _focusVisible: { outlineOffset: "3px" },
    },
  },
});

// トップの1画面。縦に並べ、スクロールすると画面ごとに吸い付く。中身は画面に入ると順に現れる
export const landingScreen = defineSlotRecipe({
  className: "landing-screen",
  description: "トップの1画面。スクロールで画面ごとに吸い付き、中身は下から順に入ってくる",
  slots: ["root", "reveal"],
  base: {
    root: {
      position: "relative",
      minHeight: "100svh",
      // 吸い付いたときの見出しの上の余白（各画面が参照する）
      "--snap-head-offset": "clamp(7rem, 16vh, 9rem)",
      [narrow]: { "--snap-head-offset": "5.5rem" },
      [phone]: {
        "--appbar-h": "calc(56px + env(safe-area-inset-top))",
        // 画面下の余白（ホームバーのある機種ではその分）
        "--safe-bottom": "max(12px, env(safe-area-inset-bottom))",
        "--snap-head-offset": "calc(var(--appbar-h) + 1.25rem)",
      },
      _scrolling: { scrollSnapAlign: "start", scrollSnapStop: "always" },
    },
    // 画面の中身は、下から順に入ってくる（delayで順番を決める）
    reveal: {
      _scrolling: { opacity: "0", transform: "translateY(2rem)" },
      "html[data-scroll] [data-active] &": {
        opacity: "1",
        transform: "none",
        transition: "opacity 0.5s ease, transform 0.7s token(easings.standard)",
        transitionDelay: "calc(0.15s + var(--reveal-order, 0) * 0.08s)",
      },
    },
  },
  variants: {
    delay: {
      0: { reveal: { "--reveal-order": "0" } },
      1: { reveal: { "--reveal-order": "1" } },
      2: { reveal: { "--reveal-order": "2" } },
      3: { reveal: { "--reveal-order": "3" } },
      4: { reveal: { "--reveal-order": "4" } },
      5: { reveal: { "--reveal-order": "5" } },
    },
  },
  defaultVariants: { delay: 0 },
});

// ホーム: 右側の帯と左上の平行線、帯の上に浮かぶキャラクター、ロゴ、キャッチコピー、説明、ボタン、「SCROLL」
export const hero = defineSlotRecipe({
  className: "hero",
  description:
    "トップの最初の画面。ロゴとキャッチコピーを大きく見せ、右にキャラクターを置き、主な操作を2つ置く。スマホではロゴ・キャラ・コピー・ボタンを縦に並べる",
  slots: [
    "root",
    "deco",
    "decoCorner",
    "art",
    "artImage",
    "spark",
    "copy",
    "logoHeading",
    "logo",
    "actions",
    "scrollHint",
  ],
  base: {
    root: {
      position: "relative",
      minHeight: "100svh",
      pt: "clamp(5.5rem, 13vh, 9rem)",
      px: sideGutter,
      pb: "clamp(4rem, 10vh, 5.5rem)",
      // 背景の帯は下の「遊び方」の白い斜めの帯まで伸ばすため、横だけ切る
      overflowX: "clip",
      // 縦向きのタブレット: 上からロゴ・キャラ・キャッチコピー・説明文・ボタンの順に縦に並べる
      [tabletPortrait]: {
        display: "flex",
        flexDirection: "column",
        height: "100svh",
        minHeight: "0",
        // 下の「SCROLL」とボタンが重ならないようにあける
        pb: "6.5rem",
      },
      // スマホ: 一番上にロゴ、その下のキャラが残りの高さをすべて使い、ボタンは画面の下に置く
      [phone]: {
        display: "flex",
        flexDirection: "column",
        height: "100svh",
        minHeight: "0",
        pt: "calc(env(safe-area-inset-top) + 0.5rem)",
        px: "4",
        pb: "calc(var(--safe-bottom) + 0.9rem)",
      },
    },
    deco: {
      position: "absolute",
      inset: `0 0 calc(-1 * ${slant})`,
      width: "full",
      height: `calc(100% + ${slant})`,
      pointerEvents: "none",
      // 縦長の画面では帯が文字に重なるため、下側だけに見せる
      [narrow]: {
        WebkitMaskImage: "linear-gradient(to bottom, transparent 55%, #000 85%)",
        maskImage: "linear-gradient(to bottom, transparent 55%, #000 85%)",
      },
      // スマホでは文字に白いフチがあるので、帯と網点は上まで見せる
      [phone]: { WebkitMaskImage: "none", maskImage: "none" },
    },
    decoCorner: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "clamp(8rem, 16vw, 15rem)",
      height: "auto",
      pointerEvents: "none",
      // 横幅いっぱいのナビに隠れて中途半端に見えるため出さない
      [narrow]: { display: "none" },
    },
    // 帯の上に浮かぶキャラクター。文字より後ろに置く。
    // 外側の箱が位置・傾き・登場、中の画像が浮遊、きらめきはその周りに散らす
    art: {
      "--tilt": "rotate(-17deg)",
      "--base": "translateY(-50%)",
      position: "absolute",
      top: "54%",
      right: "clamp(-3rem, -1vw, 2rem)",
      width: "clamp(32rem, 66vw, 82rem)",
      transform: "var(--base) var(--tilt)",
      pointerEvents: "none",
      userSelect: "none",
      animation: "hero-in 0.9s token(easings.standard) both",
      [upToLaptop]: {
        "--base": "translateY(0)",
        top: "auto",
        right: "-10vw",
        bottom: "1rem",
        width: "min(78vw, 46rem)",
      },
      [tabletPortrait]: {
        // ロゴとの間をあけるため、キャラは下げる
        "--base": "translateY(3.5rem)",
        "--tilt": "rotate(-9deg)",
        position: "relative",
        inset: "auto",
        flex: "1 1 0",
        minHeight: "12rem",
        width: "auto",
        // 右端まで広げ、キャラは右に寄せる。上下はロゴとコピーの後ろに少しもぐらせる
        mt: "-3rem",
        mr: `calc(-1 * ${sideGutter})`,
        mb: "-3.5rem",
        ml: "0",
        display: "grid",
        placeItems: "center end",
        containerType: "size",
      },
      [phone]: {
        // ロゴとの間を少しあけるため気持ち下げ、筆の先が見えるよう左に寄せる
        "--base": "translate(-7vw, 0.9rem)",
        "--tilt": "rotate(-9deg)",
        position: "relative",
        inset: "auto",
        flex: "1 1 0",
        minHeight: "7rem",
        width: "auto",
        // キャラの帽子の先がロゴの下にもぐるよう少し重ねる
        mt: "-1.6rem",
        mx: "-16px",
        mb: "-1rem",
        display: "grid",
        // 背の高い画面で余った高さは、キャラの上下に均等に回す
        placeItems: "center",
        containerType: "size",
        opacity: "1",
      },
      [phoneShort]: { mt: "-2.4rem", mb: "-1.6rem" },
      _motionReduce: { animation: "none" },
    },
    artImage: {
      display: "block",
      width: "full",
      height: "auto",
      // ロゴと同じピンクの落ち影。傾きに合わせて真下やや右にずらす
      filter:
        "drop-shadow(0.5rem 1.2rem 0 rgb(255 114 185 / 0.9)) drop-shadow(0 26px 30px rgb(255 45 135 / 0.18))",
      animation: "hero-float 6s ease-in-out infinite",
      [upToLaptop]: { animation: "none" },
      [tabletPortrait]: { width: "min(118cqw, 165cqh)", maxWidth: "none", mr: "-6cqw" },
      [phone]: {
        // 箱より大きめに描き、上はロゴ・下はコピーの後ろに少しもぐらせる。左右は画面の外に少しはみ出してよい
        width: "min(130cqw, 142cqh)",
        maxWidth: "none",
        filter:
          "drop-shadow(0.3rem 0.7rem 0 rgb(255 114 185 / 0.9)) drop-shadow(0 16px 20px rgb(255 45 135 / 0.18))",
      },
      // 箱の高さより大きくして、上下をロゴとコピーに重ねる
      [phoneShort]: { width: "min(118cqw, 150cqh)" },
      _motionReduce: { animation: "none" },
    },
    // ロゴと同じ4点のきらめき（位置と色は variant で選ぶ）
    spark: {
      position: "absolute",
      width: "clamp(2rem, 5%, 5rem)",
      height: "auto",
      transformOrigin: "center",
      animation: "hero-twinkle 2.8s ease-in-out infinite",
      animationDelay: "var(--d, 0s)",
      _motionReduce: { animation: "none" },
    },
    copy: {
      position: "relative",
      zIndex: "raised",
      maxWidth: "60rem",
      // ロゴだけキャラより上に出すため、中身をヒーローの並びに直接入れる
      [tabletPortrait]: { display: "contents" },
      [phone]: { display: "contents" },
    },
    logoHeading: {
      m: "0",
      lineHeight: "0",
      [tabletPortrait]: {
        position: "relative",
        zIndex: "raised",
        order: "-1",
        alignSelf: "stretch",
      },
      [phone]: {
        position: "relative",
        zIndex: "raised",
        order: "-1",
        alignSelf: "stretch",
        mt: "0.6rem",
        mx: "-6px",
        mb: "0",
        animation: "logo-drop 0.7s cubic-bezier(0.3, 1.5, 0.5, 1) both",
      },
      _motionReduce: { animation: "none" },
    },
    logo: {
      display: "block",
      // 画面の高さに収まるよう、低い画面では小さくする
      width: "min(100%, 47rem, 90svh)",
      height: "auto",
      ml: "-0.5rem",
      [tabletPortrait]: { width: "min(100%, 38rem)", m: "0", ml: "-0.5rem" },
      // ロゴは画面幅いっぱいに大きく
      [phone]: { width: "full", maxWidth: "26rem", mx: "auto" },
      [phoneShorter]: { maxWidth: "20rem" },
    },
    actions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "clamp(1rem, 2.5vw, 2rem)",
      mt: "clamp(1.2rem, 3.5vh, 2.2rem)",
      // ボタンは横に2つ並べる
      [tabletPortrait]: {
        position: "relative",
        zIndex: "raised",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4",
      },
      // 「ルームに参加する」は文字が長いので、こちらを広くする
      [phone]: {
        position: "relative",
        zIndex: "raised",
        display: "grid",
        gridTemplateColumns: "1fr 1.25fr",
        gap: "0.6rem",
        pt: "4",
      },
    },
    // 画面の下に出す「スクロールで次へ」
    scrollHint: {
      position: "absolute",
      zIndex: "raised",
      left: "50%",
      bottom: "5",
      display: "grid",
      justifyItems: "center",
      gap: "0.4rem",
      m: "0",
      p: "0",
      borderWidth: "none",
      bg: "none",
      fontFamily: "latin",
      fontStyle: "italic",
      fontWeight: "regular",
      fontSize: "0.72rem",
      letterSpacing: "0.3em",
      color: "fg.description",
      cursor: "pointer",
      translate: "-50% 0",
      _after: {
        content: '""',
        width: "2px",
        height: "2.4rem",
        background:
          "linear-gradient(token(colors.accent.brand) 50%, token(colors.border.default) 50%) 0 0 / 100% 200%",
        animation: "hint-line 1.6s ease-in-out infinite",
      },
      _focusVisible: { outlineOffset: "3px" },
      _plain: { display: "none" },
      [phone]: { display: "none" },
    },
  },
  variants: {
    // きらめきの位置と色
    sparkAt: {
      topLeft: { spark: { left: "9%", top: "6%", "--d": "0s", color: "info.default" } },
      topRight: { spark: { right: "6%", top: "10%", "--d": "-1.1s", color: "warning.default" } },
      bottomLeft: { spark: { left: "4%", bottom: "14%", "--d": "-1.9s", color: "accent.muted" } },
      bottomRight: { spark: { right: "14%", bottom: "4%", "--d": "-0.6s", color: "info.default" } },
    },
  },
});

// 節の見出し（英字の小見出し・見出し・説明）
export const sectionHead = defineSlotRecipe({
  className: "section-head",
  description: "トップの各画面の見出し。英字の小見出しの下に大きな見出しと短い説明を置く",
  slots: ["root", "eyebrow", "title", "description"],
  base: {
    root: { display: "grid", gap: "0.4rem" },
    eyebrow: {
      m: "0",
      fontFamily: "latin",
      fontStyle: "italic",
      fontWeight: "regular",
      fontSize: "0.8rem",
      lineHeight: "1.8",
      letterSpacing: "0.28em",
      color: "accent.default",
      [phone]: { fontSize: "0.72rem" },
    },
    title: { m: "0", textStyle: "section", [phone]: { fontSize: "1.75rem" } },
    description: {
      m: "0",
      mt: "0.3rem",
      color: "fg.description",
      fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)",
      lineHeight: "1.8",
    },
  },
});

// 遊び方: 中央のカードを大きく見せ、前後のカードを左右に少しのぞかせる
export const stepCarousel = defineSlotRecipe({
  className: "step-carousel",
  description:
    "遊び方の手順を1枚ずつ見せるカルーセル。左右のボタン・ドット・左右キー・横スワイプで切り替える",
  slots: [
    "section",
    "head",
    "carousel",
    "steps",
    "step",
    "body",
    "number",
    "numberTotal",
    "title",
    "description",
    "visual",
    "pic",
    "picNumber",
    "controls",
    "dots",
    "dot",
  ],
  base: {
    section: {
      "--card-w": "min(68rem, 72vw)",
      isolation: "isolate",
      display: "grid",
      gridTemplateRows: "auto minmax(0, 1fr)",
      gap: "clamp(1rem, 3vh, 2rem)",
      height: "100svh",
      pt: "0",
      pb: "clamp(2.5rem, 7vh, 4.5rem)",
      overflow: "hidden",
      // 斜めに切った白い帯
      _before: {
        content: '""',
        position: "absolute",
        inset: "0",
        zIndex: "-1",
        bg: "bg.surface",
        clipPath: `polygon(0 ${slant}, 100% 0, 100% calc(100% - ${slant}), 0 100%)`,
      },
      _plain: { height: "auto", minHeight: "100svh", pt: "clamp(6.5rem, 15vh, 8.5rem)" },
      [narrow]: { "--card-w": "84vw" },
      [phone]: {
        "--card-w": "calc(100vw - 40px)",
        gap: "0.9rem",
        pb: "calc(var(--safe-bottom) + 1rem)",
      },
      // 挿絵を大きく: カードを画面の幅と高さいっぱいに広げる
      [phoneShort]: { "--card-w": "calc(100vw - 26px)", gap: "0.55rem" },
    },
    head: {
      px: sideGutter,
      mt: "var(--snap-head-offset)",
      _plain: { mt: "0" },
      // 狭い画面では英字の小見出しと説明を出さない（スマホでは小見出しだけ出す）
      [narrow]: { "& [data-part='eyebrow'], & [data-part='description']": { display: "none" } },
      [phone]: { px: "4", "& [data-part='eyebrow']": { display: "block" } },
      [phoneShort]: {
        "& [data-part='eyebrow']": { display: "none" },
        "& [data-part='title']": { fontSize: "1.35rem" },
      },
    },
    carousel: {
      position: "relative",
      display: "grid",
      gridTemplateRows: "minmax(0, 1fr) auto",
      justifyItems: "center",
      gap: "clamp(1rem, 3vh, 1.75rem)",
      minHeight: "0",
      // 狭い画面ではカードの下にすぐ操作ボタンを置く
      [narrow]: { gridTemplateRows: "auto auto", alignContent: "start" },
    },
    steps: {
      position: "relative",
      width: "var(--card-w)",
      height: "full",
      maxHeight: "34rem",
      minHeight: "16rem",
      m: "0",
      p: "0",
      listStyle: "none",
      // 挿絵と文章が収まる高さを取る
      [narrow]: { height: "min(32rem, 62svh)" },
      // 画面に収まる範囲で、横幅いっぱいの絵＋番号・見出し・文章の高さまで（それ以上は絵の左右が空くので伸ばさない）
      [phone]: {
        height:
          "clamp(13rem, min(calc(100svh - var(--snap-head-offset) - var(--safe-bottom) - 10.5rem), calc((100vw - 58px) * 1095 / 1600 + 13.7rem)), 32rem)",
      },
      [phoneShort]: {
        height:
          "clamp(13rem, min(calc(100svh - var(--snap-head-offset) - var(--safe-bottom) - 7.6rem), calc((100vw - 48px) * 1095 / 1600 + 8.6rem)), 30rem)",
      },
      // JavaScriptが動かない場合は全ステップを縦に並べる
      _plain: { display: "grid", gap: "6", height: "auto", maxHeight: "none" },
    },
    // カードは内側に余白を取り、挿絵の台紙を角丸のパネルとして収める。
    // 位置（--o）・大きさ（--s）・不透明度（--a）は variant（offset）で決める
    step: {
      "--pad": "clamp(0.7rem, 1.2vw, 1rem)",
      position: "absolute",
      inset: "0",
      display: "grid",
      // 挿絵を広く見せるため、文章の列は狭めにする
      gridTemplateColumns: "minmax(0, 0.7fr) minmax(0, 1.3fr)",
      gap: "var(--pad)",
      p: "var(--pad)",
      overflow: "hidden",
      ...soft,
      borderRadius: "2xl",
      opacity: "var(--a, 1)",
      transform:
        "translateX(calc(var(--o, 0) * (100% + clamp(1.5rem, 4vw, 3.5rem)))) scale(var(--s, 1))",
      transition: "transform 0.7s token(easings.standard), opacity 0.5s ease",
      visibility: "var(--v, visible)",
      zIndex: "var(--z, 1)",
      "&:not([data-active])": { cursor: "pointer" },
      // 反対側へ回り込むカードは、画面を横切らないよう位置を瞬時に移す
      "&[data-wrap]": { transition: "opacity 0.5s ease" },
      // 挿絵を上に置き、文章の残りの高さをすべて挿絵に回す
      [narrow]: {
        "--pad": "0.6rem",
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: "minmax(8rem, 1fr) auto",
        borderRadius: "1.6rem",
      },
      [phone]: { borderRadius: "20px" },
      [phoneShort]: { "--pad": "0.45rem" },
      // カードが低いので、挿絵を小さくしてでも文章を全部見せる
      [phoneShorter]: { gridTemplateRows: "minmax(5rem, 1fr) auto" },
      _plain: { position: "relative", minHeight: "18rem" },
    },
    body: {
      display: "grid",
      alignContent: "center",
      gap: "clamp(0.5rem, 1.6vh, 0.9rem)",
      p: "clamp(0.6rem, 1.8vw, 1.75rem)",
      [narrow]: { alignContent: "start", pt: "0.4rem", px: "0.8rem", pb: "0.8rem" },
      [phoneShort]: { gap: "0.3rem", pt: "0.5rem", px: "0.6rem", pb: "0.55rem" },
    },
    number: {
      fontFamily: "display",
      fontSize: "clamp(2.6rem, min(6vw, 9vh), 4.75rem)",
      lineHeight: "0.9",
      color: "accent.default",
      [narrow]: { fontSize: "2.6rem" },
      // 低い画面: 番号は挿絵の左上に重ね、札は付けず白いフチと影で絵の上でも読めるようにする。
      // 挿絵のあるカードでは、絵を包む pic の左上（picNumber）に出す
      [phoneShort]: {
        position: "absolute",
        top: "calc(var(--pad) + 0.45rem)",
        left: "calc(var(--pad) + 0.45rem)",
        zIndex: "raised",
        fontSize: "2.4rem",
        lineHeight: "none",
        textShadow: outline,
        "& small": { color: "fg.default" },
        "[data-picture] &": { display: "none" },
      },
    },
    numberTotal: { ml: "0.4rem", fontSize: "0.3em", color: "fg.subtle" },
    title: {
      m: "0",
      fontFamily: "round",
      fontWeight: "heavy",
      fontSize: "clamp(1.3rem, min(2.4vw, 4.2vh), 2rem)",
      lineHeight: "1.3",
      [phoneShort]: { fontSize: "1.05rem" },
    },
    description: {
      maxWidth: "30em",
      m: "0",
      color: "fg.description",
      fontSize: "clamp(0.88rem, 1.1vw, 1rem)",
      lineHeight: "1.8",
      [phoneShort]: { fontSize: "0.78rem", lineHeight: "1.55" },
    },
    // 右側の挿絵: 淡い色に斜めの縞を重ね、傾けた白い札にアイコンを置く。絵があるときは切らずに全体を見せる
    visual: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      borderRadius: "calc(2rem - var(--pad))",
      background: stripes("22px", "26px"),
      color: "fg.default",
      "& svg": {
        width: "clamp(4.5rem, min(12vw, 16vh), 9rem)",
        height: "auto",
        p: "clamp(1.1rem, 2.6vw, 2rem)",
        ...soft,
        borderRadius: "2xl",
        rotate: "-6deg",
        boxSizing: "content-box",
      },
      // 枠の幅と高さのうち、先に当たるほうに合わせて縮める
      "&:has(img)": { containerType: "size", background: "none" },
      "& img": {
        display: "block",
        width: "min(100cqw, 100cqh * 1600 / 1095)",
        height: "auto",
        borderRadius: "calc(2rem - var(--pad))",
      },
      [narrow]: {
        order: "-1",
        borderRadius: "calc(1.6rem - var(--pad))",
        "& svg": { width: "clamp(2.8rem, 14vw, 4.5rem)", p: "0.9rem", borderRadius: "1.4rem" },
        "& img": { borderRadius: "calc(1.6rem - var(--pad))" },
      },
      [phone]: {
        borderRadius: "calc(20px - var(--pad))",
        "& img": { borderRadius: "calc(20px - var(--pad))" },
      },
    },
    // 挿絵と番号の入れ物。スマホの低い画面で番号を絵の左上に乗せるときだけ使う
    pic: {
      display: "contents",
      [phoneShort]: { display: "block", position: "relative", lineHeight: "0" },
    },
    picNumber: {
      display: "none",
      [phoneShort]: {
        display: "block",
        position: "absolute",
        top: "0.45rem",
        left: "0.55rem",
        zIndex: "raised",
        fontFamily: "display",
        fontSize: "2.4rem",
        lineHeight: "none",
        color: "accent.default",
        textShadow: outline,
        "& small": { ml: "0.4rem", fontSize: "0.3em", color: "fg.default" },
      },
    },
    // 左右のボタンとドット。広い画面では矢印を中央のカードの左右に置く
    controls: {
      display: "flex",
      alignItems: "center",
      gap: "5",
      [wide]: {
        minHeight: "3.2rem",
        "& [data-part='arrow']": {
          position: "absolute",
          zIndex: "2",
          top: "calc((100% - 3.2rem - clamp(1rem, 3vh, 1.75rem)) / 2)",
          translate: "0 -50%",
        },
        "& [data-part='arrow'][data-direction='prev']": {
          left: "calc(50% - var(--card-w) / 2 - 1.6rem)",
        },
        "& [data-part='arrow'][data-direction='next']": {
          right: "calc(50% - var(--card-w) / 2 - 1.6rem)",
        },
      },
      [phone]: { gap: "4" },
      // 送りボタンはカードに寄せる
      [phoneShort]: { mt: "-0.35rem" },
      _plain: { display: "none" },
    },
    dots: { display: "flex", gap: "0.6rem", m: "0", p: "0", listStyle: "none" },
    dot: {
      display: "block",
      width: "0.75rem",
      height: "0.75rem",
      p: "0",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "control",
      bg: "bg.surface",
      cursor: "pointer",
      transition: "width 0.4s token(easings.sweep), background 0.3s, border-color 0.3s",
      "&[aria-current='true']": { width: "8", borderColor: "accent.default", bg: "accent.default" },
      _focusVisible: { outlineOffset: "3px" },
    },
  },
  variants: {
    // カードの地の色（順に水色・ピンク・黄色）
    tint: {
      cyan: { step: { "--tint": "token(colors.tint.cyan)" } },
      pink: { step: { "--tint": "token(colors.tint.pink)" } },
      yellow: { step: { "--tint": "token(colors.tint.yellow)" } },
    },
    // 中央からの位置（-1: 左、0: 中央、1: 右）。はみ出すカードは隠す
    offset: {
      "-2": { step: { "--o": "-2", "--s": "0.84", "--a": "0", "--z": "0", "--v": "hidden" } },
      "-1": { step: { "--o": "-1", "--s": "0.84", "--a": "0.5", "--z": "1", "--v": "visible" } },
      "0": { step: { "--o": "0", "--s": "1", "--a": "1", "--z": "2", "--v": "visible" } },
      "1": { step: { "--o": "1", "--s": "0.84", "--a": "0.5", "--z": "1", "--v": "visible" } },
      "2": { step: { "--o": "2", "--s": "0.84", "--a": "0", "--z": "0", "--v": "hidden" } },
    },
  },
  defaultVariants: { tint: "cyan", offset: "0" },
});

// 採点方法: 3枚のカードと合計の式
export const scoreCards = defineSlotRecipe({
  className: "score-cards",
  description:
    "スコアの3つの要素を並べたカード。上端の色帯とアイコンで区別する。スマホでは横長のカードを縦に並べる",
  slots: ["section", "head", "list", "card", "icon", "title", "description", "total", "totalBadge"],
  base: {
    section: {
      display: "grid",
      alignContent: "start",
      gap: "clamp(1.75rem, 5vh, 3rem)",
      pt: "0",
      px: "clamp(2.5rem, 6vw, 6.5rem)",
      pb: "clamp(3rem, 8vh, 5rem)",
      _plain: { minHeight: "100svh", alignContent: "center", pt: "clamp(7rem, 16vh, 9rem)" },
      [narrow]: { gap: "5" },
      [phone]: { gap: "4", px: "4", pb: "calc(var(--safe-bottom) + 1.25rem)" },
      [phoneLow]: { gap: "0.75rem" },
    },
    head: {
      mt: "var(--snap-head-offset)",
      _plain: { mt: "0" },
      [phone]: { "& [data-part='eyebrow'], & [data-part='description']": { fontSize: "0.88rem" } },
      [phoneLow]: {
        "& [data-part='eyebrow'], & [data-part='description']": { fontSize: "0.8rem" },
      },
    },
    list: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "clamp(1rem, 2.5vw, 2rem)",
      m: "0",
      p: "0",
      listStyle: "none",
      [narrow]: { gridTemplateColumns: "minmax(0, 1fr)", gap: "0.9rem" },
      [phone]: { gap: "3" },
    },
    card: {
      position: "relative",
      display: "grid",
      alignContent: "start",
      gap: "0.8rem",
      p: "clamp(1.4rem, 3vw, 2.25rem)",
      overflow: "hidden",
      ...soft,
      borderRadius: "xl",
      // 上端の色帯（スマホでは左端）
      _before: {
        content: '""',
        position: "absolute",
        inset: "0 0 auto",
        height: "0.65rem",
        bg: "var(--tint-strong)",
      },
      [narrow]: {
        gridTemplateColumns: "auto 1fr",
        columnGap: "4",
        rowGap: "0.2rem",
        pt: "1.1rem",
        px: "1.2rem",
        pb: "1.2rem",
      },
      [phone]: {
        pt: "4",
        pr: "4",
        pb: "4",
        pl: "1.1rem",
        borderRadius: "20px",
        _before: { inset: "0 auto 0 0", width: "6px", height: "auto" },
      },
      [phoneLow]: { pt: "0.7rem", pb: "0.8rem" },
    },
    icon: {
      display: "grid",
      placeItems: "center",
      width: "3.6rem",
      height: "3.6rem",
      mt: "2",
      borderRadius: "md",
      bg: "var(--tint)",
      color: "fg.default",
      [narrow]: { gridRow: "span 2", width: "12", height: "12" },
      [phone]: { mt: "0", alignSelf: "center", borderRadius: "14px" },
    },
    title: {
      m: "0",
      fontFamily: "round",
      fontWeight: "heavy",
      fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)",
      [narrow]: { alignSelf: "end" },
      [phone]: { fontSize: "1.15rem" },
    },
    description: {
      m: "0",
      color: "fg.description",
      fontSize: "clamp(0.92rem, 1.2vw, 1rem)",
      lineHeight: "1.8",
      [narrow]: { fontSize: "0.85rem", lineHeight: "1.65" },
      [phoneLow]: { fontSize: "0.78rem", lineHeight: "1.55" },
    },
    total: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem 0.9rem",
      m: "0",
      fontWeight: "bold",
      fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)",
      [phone]: {
        gap: "0.4rem 0.6rem",
        py: "0.8rem",
        px: "4",
        borderRadius: "16px",
        bg: "bg.surface",
        fontSize: "0.85rem",
      },
    },
    totalBadge: {
      py: "0.3rem",
      px: "0.9rem",
      borderRadius: "control",
      bg: "bg.inverse",
      color: "fg.inverse",
    },
  },
  variants: {
    tint: {
      pink: {
        card: {
          "--tint-strong": "token(colors.accent.brand)",
          "--tint": "token(colors.tint.pink)",
        },
      },
      cyan: {
        card: {
          "--tint-strong": "token(colors.info.default)",
          "--tint": "token(colors.tint.cyan)",
        },
      },
      yellow: {
        card: {
          "--tint-strong": "token(colors.warning.default)",
          "--tint": "token(colors.tint.yellow)",
        },
      },
    },
  },
  defaultVariants: { tint: "pink" },
});

// ギャラリー: 対戦を1つずつ、お題と提出画像を並べて見せる。
// PC: 左の列に見出し → 対戦の情報 → 左右のボタン、右の列に画像2枚。狭い画面では見出し → 画像 → 対戦の情報の順に縦に積む
export const gallery = defineSlotRecipe({
  className: "gallery",
  description:
    "みんなの対戦を1つずつ見せる。左右のボタン・ドット・左右キー・横スワイプで対戦を切り替える",
  slots: [
    "section",
    "body",
    "head",
    "card",
    "top",
    "number",
    "numberTotal",
    "controls",
    "info",
    "tags",
    "level",
    "title",
    "score",
    "row",
    "value",
    "meter",
    "meterBar",
    "viewer",
    "shot",
    "shotCaption",
  ],
  base: {
    section: { minHeight: "100svh", display: "grid", gridTemplateRows: "1fr auto" },
    body: {
      // 画像の高さ。画面の高さから見出しと余白を引いた分か、幅から決まる大きさの小さいほう
      "--shot-h":
        "min(100svh - var(--snap-head-offset, 8rem) - 14rem, (44vw - 12rem) * 1216 / 832)",
      display: "grid",
      gridTemplateColumns: "minmax(18rem, 1fr) auto",
      // 2行の高さの合計は右の画像のパネルの高さになる
      gridTemplateRows: "auto auto",
      gridTemplateAreas: '"head viewer" "info viewer"',
      alignContent: "start",
      gap: "clamp(1rem, 3vh, 1.75rem) clamp(2rem, 5vw, 5rem)",
      pt: "var(--snap-head-offset)",
      px: "clamp(2.5rem, 6vw, 6.5rem)",
      pb: "8",
      _plain: { pt: "clamp(7rem, 16vh, 9rem)" },
      // 高さの低い画面では、フッターと合わせて1画面に収める
      [wideShort]: { gap: "1.1rem", pb: "4" },
      [narrow]: {
        "--shot-h":
          "min(100svh - var(--snap-head-offset, 8rem) - 24rem, (50vw - 2.4rem) * 1216 / 832)",
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: "none",
        gridTemplateAreas: '"head" "viewer" "info"',
        rowGap: "4",
      },
      [phone]: {
        "--shot-h":
          "min(100svh - var(--snap-head-offset, 8rem) - 22rem, (50vw - 2.2rem) * 1216 / 832)",
        gap: "0.75rem",
        px: "4",
        pb: "5",
      },
    },
    // 見出し。右の画像のパネルの高さに合わせて行が伸び、小見出し・見出し・説明の間が広がる
    head: { gridArea: "head", display: "grid", "& > *": { display: "grid" } },
    // いま見ている対戦のカード: 左の列の幅いっぱい。下端を右の画像のパネルの下端にそろえる
    card: {
      gridArea: "info",
      alignSelf: "end",
      display: "grid",
      gap: "1.1rem",
      p: "clamp(1.1rem, 2vw, 1.6rem)",
      ...soft,
      borderRadius: "1.6rem",
      [narrow]: { alignSelf: "auto" },
      [phone]: { gap: "0.8rem", pt: "0.9rem", px: "4", pb: "4", borderRadius: "20px" },
    },
    top: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4" },
    // 番号は遊び方のカードと同じ見せ方
    number: {
      m: "0",
      fontFamily: "display",
      fontSize: "clamp(2.4rem, min(4.4vw, 7vh), 3.6rem)",
      lineHeight: "0.9",
      color: "accent.default",
      [phone]: { fontSize: "2.2rem" },
    },
    numberTotal: { ml: "0.4rem", fontSize: "0.3em", color: "fg.subtle" },
    controls: {
      display: "flex",
      alignItems: "center",
      gap: "0.9rem",
      // 矢印は遊び方より少し小さく
      "& > button": { width: "2.75rem", height: "2.75rem" },
    },
    info: { display: "grid", gap: "0.55rem" },
    tags: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "0.4rem 0.6rem",
      m: "0",
      fontSize: "0.88rem",
      color: "fg.description",
    },
    level: {
      py: "0.15rem",
      px: "0.6rem",
      borderRadius: "xs",
      fontSize: "0.75rem",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      bg: "bg.surface",
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderColor: "border.default",
      color: "fg.default",
    },
    title: {
      m: "0",
      fontFamily: "round",
      fontWeight: "heavy",
      fontSize: "clamp(1.25rem, min(2vw, 3.6vh), 1.7rem)",
      lineHeight: "1.3",
      [phone]: { fontSize: "1.15rem" },
    },
    // 再現度: 点線で区切ってカードの下に
    score: {
      display: "grid",
      gap: "2",
      pt: "1.1rem",
      borderTopWidth: "thick",
      borderTopStyle: "dashed",
      borderTopColor: "border.default",
      [phone]: { pt: "0.8rem" },
    },
    row: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "2",
      fontWeight: "bold",
    },
    value: {
      fontFamily: "display",
      fontWeight: "regular",
      fontSize: "1.9rem",
      lineHeight: "none",
      "& small": { ml: "0.1em", fontSize: "0.5em" },
      [phone]: { fontSize: "1.5rem" },
    },
    meter: { height: "2", borderRadius: "control", bg: "bg.sunken", overflow: "hidden" },
    meterBar: {
      display: "block",
      height: "full",
      width: "var(--meter, 0%)",
      borderRadius: "inherit",
      background: "linear-gradient(90deg, token(colors.info.default), token(colors.accent.brand))",
      transition: "width 0.5s token(easings.standard)",
    },
    viewer: {
      gridArea: "viewer",
      alignSelf: "start",
      display: "grid",
      gridTemplateColumns: "auto auto",
      gap: "3",
      p: "4",
      ...soft,
      borderRadius: "1.6rem",
      // 画像のパネルとカードは同じ幅（列いっぱい）にそろえ、画像はパネルの中央に置く
      [narrow]: { justifyContent: "center" },
      [phone]: { gap: "2", p: "0.6rem", borderRadius: "20px" },
    },
    // 画像の代わりに、色と模様で表す。生成画像と同じ縦長（832×1216）
    shot: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      height: "max(12rem, var(--shot-h))",
      aspectRatio: "832 / 1216",
      m: "0",
      borderRadius: "md",
      background: stripes("16px", "19px"),
      color: "rgb(11 27 43 / 0.35)",
      transition: "background-color 0.3s",
    },
    shotCaption: {
      position: "absolute",
      top: "0.6rem",
      left: "0.6rem",
      py: "0.15rem",
      px: "0.6rem",
      borderRadius: "control",
      bg: "bg.surface",
      fontSize: "0.75rem",
      fontWeight: "bold",
      color: "fg.default",
    },
  },
  variants: {
    tint: {
      cyan: { shot: { "--tint": "token(colors.tint.cyan)" } },
      pink: { shot: { "--tint": "token(colors.tint.pinkDeep)" } },
      yellow: { shot: { "--tint": "token(colors.tint.yellow)" } },
      green: { shot: { "--tint": "token(colors.tint.green)" } },
      purple: { shot: { "--tint": "token(colors.tint.purple)" } },
    },
  },
  defaultVariants: { tint: "cyan" },
});

// フッター: ロゴ・規約へのリンク・著作権表示
export const siteFooter = defineSlotRecipe({
  className: "site-footer",
  description: "トップの最後に置くフッター",
  slots: ["root", "logo", "legal", "link", "copyright"],
  base: {
    root: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem 2rem",
      pt: "8",
      px: sideGutter,
      pb: "10",
      borderTopWidth: "thin",
      borderTopStyle: "solid",
      borderTopColor: "border.default",
      bg: "bg.translucentSurface",
      [wideShort]: { py: "4" },
      [phone]: {
        justifyContent: "center",
        gap: "0.8rem 1.5rem",
        pt: "6",
        px: "4",
        pb: "calc(var(--safe-bottom) + 1.5rem)",
        textAlign: "center",
      },
    },
    logo: { display: "block", width: "7.5rem", height: "auto" },
    legal: { display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem", fontSize: "0.85rem" },
    link: { color: "fg.description", textDecoration: "underline" },
    copyright: { width: "full", textAlign: "center", fontSize: "0.75rem", color: "fg.subtle" },
  },
});
