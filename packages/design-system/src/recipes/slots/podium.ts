import { defineSlotRecipe } from "@pandacss/dev";
export const podium = defineSlotRecipe({
  className: "podium",
  slots: ["avatar", "root", "item", "image", "name", "value", "step", "decoration"],
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
  },
});
