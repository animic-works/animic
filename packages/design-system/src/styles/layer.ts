import { defineLayerStyles } from "@pandacss/dev";

// 面の重なり。地・線・影の組み合わせを、奥から手前の順に持つ
export const layerStyles = defineLayerStyles({
  // くぼんだ面（統計のタイル・タグの地）
  sunken: { value: { backgroundColor: "bg.sunken", borderWidth: "none", boxShadow: "none" } },
  // 線で区切る面（一覧の行・選択肢）
  surface: {
    value: {
      backgroundColor: "bg.surface",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      boxShadow: "none",
    },
  },
  // 浮いた面（カード・パネル）
  raised: { value: { backgroundColor: "bg.surface", borderWidth: "none", boxShadow: "elevated" } },
  // 淡い縁とやわらかい影の面（ロビーのカード）
  soft: {
    value: {
      backgroundColor: "bg.surface",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      boxShadow: "surface",
    },
  },
  // ステッカーのような紺の太い縁と硬い影（遊び方・スコア・対戦のパネル）
  sticker: {
    value: {
      backgroundColor: "bg.surface",
      borderWidth: "heavy",
      borderStyle: "solid",
      borderColor: "border.strong",
      boxShadow: "stickerSm",
    },
  },
  // いちばん手前（ダイアログ・メニュー）
  overlay: {
    value: {
      backgroundColor: "bg.elevated",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      boxShadow: "surface",
    },
  },
});
