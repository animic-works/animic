import { defineSlotRecipe } from "@pandacss/dev";

// 参加者のアイコン。画像がなければ頭文字を、参加者の色の丸で出す
export const avatar = defineSlotRecipe({
  className: "avatar",
  description: "参加者を表す丸いアイコン。色は参加順のplayerで選ぶ",
  slots: ["root", "image", "fallback"],
  base: {
    root: {
      position: "relative",
      display: "inline-grid",
      placeItems: "center",
      flexShrink: "0",
      overflow: "hidden",
      borderRadius: "full",
      bg: "var(--avatar-bg)",
      color: "var(--avatar-fg)",
      fontFamily: "round",
      fontWeight: "heavy",
      lineHeight: "none",
    },
    image: { width: "full", height: "full", objectFit: "cover" },
    fallback: { userSelect: "none" },
  },
  variants: {
    // 頭文字の色は、地の色との差が大きな文字の基準（3:1）を満たす方（白か黒）を選んでいる
    player: {
      1: {
        root: {
          "--avatar-bg": "token(colors.player.1)",
          "--avatar-fg": "token(colors.fg.inverse)",
        },
      },
      2: {
        root: {
          "--avatar-bg": "token(colors.player.2)",
          "--avatar-fg": "token(colors.fg.default)",
        },
      },
      3: {
        root: {
          "--avatar-bg": "token(colors.player.3)",
          "--avatar-fg": "token(colors.fg.default)",
        },
      },
      4: {
        root: {
          "--avatar-bg": "token(colors.player.4)",
          "--avatar-fg": "token(colors.fg.default)",
        },
      },
      5: {
        root: {
          "--avatar-bg": "token(colors.player.5)",
          "--avatar-fg": "token(colors.fg.default)",
        },
      },
      6: {
        root: {
          "--avatar-bg": "token(colors.player.6)",
          "--avatar-fg": "token(colors.fg.default)",
        },
      },
      7: {
        root: {
          "--avatar-bg": "token(colors.player.7)",
          "--avatar-fg": "token(colors.fg.inverse)",
        },
      },
    },
    size: {
      sm: { root: { width: "8", height: "8", fontSize: "sm" } },
      md: { root: { width: "12", height: "12", fontSize: "xl" } },
      lg: { root: { width: "20", height: "20", fontSize: "3xl" } },
      // ロビーの参加者の枠（表示用の書体）
      tile: {
        root: {
          width: "3.3rem",
          height: "3.3rem",
          fontFamily: "display",
          fontWeight: "regular",
          fontSize: "1.3rem",
        },
      },
      // 対戦状況の行
      row: { root: { width: "2.4rem", height: "2.4rem", fontSize: "md" } },
      // 結果のカード
      who: { root: { width: "2.3rem", height: "2.3rem", fontSize: "md" } },
    },
  },
  defaultVariants: { player: 1, size: "md" },
});
