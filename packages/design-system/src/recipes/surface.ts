import { defineRecipe } from "@pandacss/dev";

// 面（カード・パネル・タイル）。奥行き（variant）と内側の余白（padding）を持つ
export const surface = defineRecipe({
  className: "surface",
  description:
    "内容をまとめる面。画面の主役のまとまりはraised、一覧の行はoutline、補助的なタイルはsunken、遊びの画面の主役はsticker",
  base: {
    position: "relative",
    display: "block",
    minWidth: "0",
  },
  variants: {
    variant: {
      raised: { layerStyle: "raised", borderRadius: "card" },
      outline: { layerStyle: "surface", borderRadius: "panel" },
      sunken: { layerStyle: "sunken", borderRadius: "panel" },
      inverse: { bg: "bg.inverse", color: "fg.inverse", borderRadius: "panel" },
      // 主役の強調（ピンクの縁と淡いピンクの地）
      accent: {
        bg: "accent.subtle",
        borderWidth: "thick",
        borderStyle: "solid",
        borderColor: "accent.muted",
        borderRadius: "panel",
      },
      // ステッカーのように、紺の太い縁と硬い影を付けた面（対戦・結果のパネル）
      sticker: { layerStyle: "sticker", borderRadius: "lg" },
      // 淡い縁とやわらかい影の面（ロビーのカード）
      soft: { layerStyle: "soft", borderRadius: "1.6rem" },
    },
    padding: {
      none: { p: "0" },
      sm: { p: "3" },
      md: { p: "5" },
      lg: { p: "8" },
      // 画面の幅に合わせて広がる余白（カード）
      fluid: { p: "clamp(1.1rem, 2.5vw, 1.5rem)" },
    },
  },
  defaultVariants: { variant: "raised", padding: "md" },
});
