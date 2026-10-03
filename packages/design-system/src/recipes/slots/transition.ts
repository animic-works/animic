import { defineSlotRecipe } from "@pandacss/dev";

// 画面遷移: 3色の帯が斜めに塗り重なり、次の画面で抜けていく。
// ルーム作成では、コードがスロットのように回って確定する
export const pageWipe = defineSlotRecipe({
  className: "page-wipe",
  description:
    "画面を3色の帯で塗りつぶす遷移の演出。塗る（in）・覆う（cover）・抜ける（out）の3段階",
  slots: ["root", "band", "logo", "room", "roomLabel", "code", "char", "roomSub", "skip", "kbd"],
  base: {
    root: {
      position: "fixed",
      inset: "0",
      zIndex: "wipe",
      overflow: "hidden",
      pointerEvents: "none",
    },
    band: {
      position: "absolute",
      top: "-25%",
      left: "-30%",
      width: "160%",
      height: "150%",
      transform: "translateX(-120%) skewX(-18deg)",
      "&:nth-child(1)": { bg: "info.default" },
      "&:nth-child(2)": { bg: "warning.default" },
      "&:nth-child(3)": { bg: "accent.brand" },
    },
    logo: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "clamp(6rem, 18vw, 9rem)",
      height: "auto",
      translate: "-50% -50%",
      scale: "0",
      filter: "drop-shadow(0 10px 0 rgb(11 27 43 / 0.25))",
    },
    room: {
      position: "absolute",
      inset: "0",
      display: "grid",
      placeContent: "center",
      justifyItems: "center",
      gap: "5",
      p: "4",
      color: "fg.inverse",
      textAlign: "center",
      opacity: "0",
    },
    roomLabel: {
      m: "0",
      fontFamily: "round",
      fontWeight: "heavy",
      fontSize: "clamp(1.2rem, 4.5vw, 1.7rem)",
      letterSpacing: "0.06em",
    },
    code: {
      display: "grid",
      gridTemplateColumns: "repeat(8, clamp(2.1rem, 9.5vw, 3.6rem))",
      gap: "clamp(0.25rem, 1vw, 0.5rem)",
    },
    char: {
      display: "grid",
      placeItems: "center",
      aspectRatio: "3 / 4",
      borderRadius: "0.6rem",
      bg: "bg.surface",
      color: "fg.default",
      fontFamily: "mono",
      fontWeight: "bold",
      fontSize: "clamp(1.2rem, 5vw, 2rem)",
      lineHeight: "none",
      boxShadow: "0 5px 0 rgb(11 27 43 / 0.35)",
      "&[data-spinning]": { color: "fg.faint" },
      "&[data-set]": { animation: "char-set 0.35s token(easings.pop)" },
    },
    roomSub: { m: "0", minHeight: "1.5em", fontSize: "0.9rem", fontWeight: "bold", opacity: "0.9" },
    // 演出を飛ばすボタン（画面下部の中央）。枠線やリングは付けず、暗めの半透明にする
    skip: {
      position: "absolute",
      zIndex: "raised",
      left: "50%",
      bottom: "calc(clamp(1.5rem, 5vh, 2.5rem) + env(safe-area-inset-bottom, 0px))",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.6rem",
      py: "0.7rem",
      pr: "1.1rem",
      pl: "1.4rem",
      borderWidth: "none",
      borderRadius: "control",
      bg: "rgb(11 27 43 / 0.55)",
      color: "fg.inverse",
      fontFamily: "body",
      fontSize: "0.95rem",
      fontWeight: "bold",
      letterSpacing: "0.08em",
      cursor: "pointer",
      pointerEvents: "auto",
      opacity: "0",
      translate: "-50% 0",
      transitionProperty: "background-color",
      transitionDuration: "normal",
      "&:hover, &:focus-visible": { bg: "rgb(11 27 43 / 0.8)", outline: "none" },
      _disabled: { opacity: "0 !important" },
    },
    kbd: {
      py: "0.1rem",
      px: "0.45rem",
      borderRadius: "0.35rem",
      bg: "rgb(255 255 255 / 0.18)",
      fontFamily: "body",
      fontSize: "0.7rem",
      fontWeight: "bold",
      letterSpacing: "normal",
    },
  },
  variants: {
    phase: {
      // 1. 塗る（遷移元）
      in: {
        band: {
          animation: "band-in 0.75s token(easings.sweep) forwards",
          "&:nth-child(2)": { animationDelay: "0.14s" },
          "&:nth-child(3)": { animationDelay: "0.28s" },
        },
        logo: { animation: "logo-pop 0.5s token(easings.pop) 0.9s forwards" },
        room: { animation: "room-in 0.4s ease-out 0.95s forwards" },
        skip: { animation: "room-in 0.4s ease-out 0.95s forwards" },
      },
      // 2. 塗りつぶしたまま待つ（遷移先の読み込み中）
      cover: {
        band: { transform: "translateX(0) skewX(-18deg)" },
        logo: { scale: "1" },
        room: { opacity: "1" },
      },
      // 3. 抜ける（遷移先）
      out: {
        band: {
          transform: "translateX(0) skewX(-18deg)",
          animation: "band-out 0.75s token(easings.sweep) forwards",
          "&:nth-child(3)": { animationDelay: "0.25s" },
          "&:nth-child(2)": { animationDelay: "0.39s" },
          "&:nth-child(1)": { animationDelay: "0.53s" },
        },
        logo: { scale: "1", animation: "logo-out 0.35s ease-in forwards" },
        room: { opacity: "1", animation: "room-out 0.35s ease-in forwards" },
      },
    },
    // ルームコードの演出のときはロゴを出さない
    content: {
      logo: {},
      room: { logo: { display: "none" } },
    },
  },
  defaultVariants: { phase: "in", content: "logo" },
});

// 遷移先で順に出てくる要素（ロビーのパネルなど）
export const entrance = defineSlotRecipe({
  className: "entrance",
  description: "画面遷移の帯が抜けたあと、順に弾んで現れる要素。順番（order）で遅らせる",
  slots: ["root"],
  base: {
    root: {
      _entering: {
        animation: "card-rise 0.8s token(easings.rise) both",
        animationDelay: "calc(0.6s + var(--enter-order, 0) * 0.12s)",
      },
    },
  },
  variants: {
    order: {
      0: { root: { "--enter-order": "0" } },
      1: { root: { "--enter-order": "1" } },
      2: { root: { "--enter-order": "2" } },
      3: { root: { "--enter-order": "3" } },
      4: { root: { "--enter-order": "4" } },
    },
    // 画面下に固定した要素を含むパネルは、位置を動かさずフェードだけにする
    // （transform をかけると固定位置の基準がパネルに変わってしまうため）
    motion: {
      rise: {},
      fade: { root: { mdDown: { _entering: { animationName: "fade-in" } } } },
    },
  },
  defaultVariants: { order: 0, motion: "rise" },
});
