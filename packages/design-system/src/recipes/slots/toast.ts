import { defineSlotRecipe } from "@pandacss/dev";
export const toast = defineSlotRecipe({
  className: "toast",
  slots: ["viewport", "root", "title", "description"],
  base: {
    // 画面下の中央に置く。下端は余白とsafe-areaの大きい方だけ離す。
    viewport: {
      direction: "inherit",
      zIndex: "toast",
      boxSizing: "border-box",
      fontSynthesis: "none",
      "--animic-toast-inset": "token(spacing.5)",
      insetBlockEnd:
        "max(var(--animic-toast-inset), var(--animic-toast-safe-block-end, env(safe-area-inset-bottom, 0px)))",
      insetInline: "0",
      "& *, &::before, &::after, & *::before, & *::after": { boxSizing: "border-box" },
    },
    // 表示・置き換え・退場の位置と透明度は、Ark UIが通知ごとに設定する変数から決める。
    root: {
      direction: "inherit",
      boxSizing: "border-box",
      display: "grid",
      gap: "1",
      maxWidth: "min(27rem, calc(100vw - 2rem))",
      paddingInline: "5",
      paddingBlock: "3",
      borderRadius: "full",
      background: "bg.inverse",
      color: "fg.inverse",
      fontSynthesis: "none",
      translate: "var(--x) var(--y)",
      scale: "var(--scale)",
      opacity: "var(--opacity)",
      transitionProperty: "translate, scale, opacity",
      transitionDuration: "3",
      transitionTimingFunction: "expressive",
      willChange: "translate, opacity, scale",
      "&:has([data-part=description])": { borderRadius: "2" },
      _motionReduce: { transitionDuration: "0" },
    },
    title: {
      textStyle: "label.supporting",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    description: {
      textStyle: "body.sm",
      color: "color-mix(in srgb, token(colors.fg.inverse) 80%, token(colors.bg.inverse))",
    },
  },
});
