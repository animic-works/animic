import { defineSlotRecipe } from "@pandacss/dev";

// 通知: 画面の下の中央に短く出す黒い丸い帯
export const toast = defineSlotRecipe({
  className: "toast",
  description: "操作の結果を短く知らせる通知。画面の下の中央に出て、自動で消える",
  slots: ["root", "title"],
  base: {
    root: {
      position: "relative",
      zIndex: "var(--z-index)",
      translate: "var(--x) var(--y)",
      scale: "var(--scale)",
      opacity: "var(--opacity)",
      height: "var(--height)",
      willChange: "translate, opacity, scale",
      transition: "translate 400ms, scale 400ms, opacity 400ms, height 400ms",
      transitionTimingFunction: "cubic-bezier(0.21, 1.02, 0.73, 1)",
      display: "flex",
      alignItems: "center",
      py: "3",
      px: "5",
      borderRadius: "control",
      bg: "bg.inverse",
      color: "fg.inverse",
      fontSize: "0.9rem",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      "&[data-state='closed']": { transition: "translate 400ms, scale 400ms, opacity 200ms" },
      // スマホ: 画面の下に固定した操作のバーの上に出し、長い文は省略する
      "@media (max-width: 560px)": {
        maxWidth: "calc(100% - 32px)",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
    title: { m: "0" },
  },
});
