import { defineSlotRecipe } from "@pandacss/dev";
export const podium = defineSlotRecipe({
  className: "podium",
  slots: [
    "avatar",
    "root",
    "item",
    "image",
    "name",
    "value",
    "step",
    "decoration",
    "stepDecoration",
  ],
  base: {
    avatar: { display: "inline-flex", _podiumCompact: { display: "none" } },
    root: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 15rem))",
      width: "100%",
      justifyContent: "center",
      alignItems: "end",
      gap: "clamp(0.6rem, 2vw, 1.4rem)",
      maxWidth: "48rem",
      margin: "1.4rem auto 0",

      _podiumCompact: { gap: "0.4rem" },
    },
    item: {
      display: "grid",
      gap: "0.6rem",
      textAlign: "center",
      minWidth: 0,
      position: "relative",
      gridRow: "1",
      "&:nth-child(1)": { gridColumn: "2" },
      "&:nth-child(2)": { gridColumn: "1" },
      "&:nth-child(3)": { gridColumn: "3" },
    },
    image: {
      width: "86%",
      marginInline: "auto",
      height: "auto",
      aspectRatio: "13 / 19",
      objectFit: "cover",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1.25rem",
      background: "bg.surface",
      boxShadow: "soft.1",
    },
    name: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "2",
      textStyle: "label.supporting",
      _podiumCompact: { textStyle: "caption", fontWeight: "bold" },
      minWidth: 0,
      overflowWrap: "anywhere",
    },
    value: {
      textStyle: "numeric.display",
      fontSize: "1.6rem",
      _podiumCompact: { fontSize: "1.1rem" },
    },
    step: {
      display: "grid",
      placeItems: "center",
      height: "3.25rem",
      borderRadius: "1rem 1rem 0 0",
      background: "accent.highlight",
      color: "fg.default",
      textStyle: "numeric.display",
      _podiumCompact: { height: "2.25rem" },
    },
    decoration: { position: "absolute", top: "-2rem", left: "50%", translate: "-50% 0", zIndex: 1 },
    stepDecoration: { position: "absolute", inset: "0", pointerEvents: "none" },
  },
  variants: {
    entering: {
      true: {
        item: {
          animation: "itemRise 900ms cubic-bezier(.3,1.6,.5,1) both",
          animationDelay: "1.1s",
          "&:nth-child(2)": { animationDelay: "750ms" },
          "&:nth-child(3)": { animationDelay: "400ms" },
          _motionReduce: { animation: "none" },
        },
      },
    },
    place: {
      first: {
        value: { fontSize: "2.1rem", _podiumCompact: { fontSize: "1.4rem" } },
        image: {
          width: "100%",
          borderColor: "accent.highlight",
          boxShadow:
            "0 0 0 4px color-mix(in srgb, token(colors.accent.highlight) 35%, transparent), token(shadows.soft.1)",
        },
        step: {
          height: "6rem",
          background: "linear-gradient(token(colors.accent.primary), token(colors.pink.3))",
          color: "fg.inverse",
          _podiumCompact: { height: "4rem" },
        },
      },
      second: {
        step: {
          height: "4.4rem",
          background: "linear-gradient(token(colors.accent.secondary), token(colors.cyan.1))",
          color: "fg.inverse",
          _podiumCompact: { height: "3rem" },
        },
      },
      third: { step: { color: "fg.default", background: "linear-gradient(#ffd23d, #f0b400)" } },
    },
    // 人ごとの縦長のカード。枠と下の帯を順位の色で塗り、1位のカードを一回り大きく中央に置く。
    presentation: {
      steps: {},
      card: {
        root: {
          gridTemplateColumns: "minmax(0, 13rem) minmax(0, 15.5rem) minmax(0, 13rem)",
          maxWidth: "46rem",
          _podiumCompact: {
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.18fr) minmax(0, 1fr)",
          },
        },
        item: {
          gap: "0.45rem",
          padding: "0.55rem 0.55rem 0",
          borderWidth: "3",
          borderStyle: "solid",
          borderColor: "var(--animic-podium-color)",
          borderRadius: "1.25rem",
          background: "bg.surface",
          boxShadow: "soft.1",
          _podiumCompact: { padding: "0.35rem 0.35rem 0", borderRadius: "1rem" },
        },
        image: {
          width: "100%",
          border: "0",
          borderRadius: "0.85rem",
          boxShadow: "none",
          _podiumCompact: { borderRadius: "0.65rem" },
        },
        step: {
          position: "relative",
          height: "3rem",
          marginInline: "-0.55rem",
          borderRadius: "0 0 1rem 1rem",
          _podiumCompact: {
            height: "2.4rem",
            marginInline: "-0.35rem",
            borderRadius: "0 0 0.8rem 0.8rem",
          },
        },
      },
    },
  },
  compoundVariants: [
    {
      presentation: "card",
      place: "first",
      css: {
        item: {
          "--animic-podium-color": "token(colors.accent.primary)",
          boxShadow:
            "0 0 0 6px color-mix(in srgb, token(colors.accent.primary) 14%, transparent), 0 14px 40px -12px color-mix(in srgb, token(colors.accent.primary) 55%, transparent)",
        },
        image: { width: "100%", border: "0", boxShadow: "none" },
        step: { height: "3.6rem", _podiumCompact: { height: "2.8rem" } },
      },
    },
    {
      presentation: "card",
      place: "second",
      css: {
        item: { "--animic-podium-color": "token(colors.accent.secondary)" },
        step: { height: "3rem", _podiumCompact: { height: "2.4rem" } },
      },
    },
    {
      presentation: "card",
      place: "third",
      css: {
        item: { "--animic-podium-color": "token(colors.accent.highlight)" },
      },
    },
  ],
});
