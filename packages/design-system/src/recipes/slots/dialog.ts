import { defineSlotRecipe } from "@pandacss/dev";

// ダイアログ。部分の名前はAnimicが決める（Ark UIの部品とはReact側で対応づける）
export const dialog = defineSlotRecipe({
  className: "dialog",
  description: "画面の手前に開く確認・選択の窓。閉じる手段を必ず用意する",
  slots: [
    "backdrop",
    "positioner",
    "content",
    "title",
    "description",
    "body",
    "footer",
    "closeTrigger",
  ],
  base: {
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: "overlay",
      bg: "bg.backdrop",
      backdropFilter: "blur(3px)",
      _open: { animationStyle: "fade-in" },
      _closed: { animationStyle: "fade-out" },
    },
    positioner: {
      position: "fixed",
      inset: "0",
      zIndex: "modal",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "4",
      overflowY: "auto",
    },
    content: {
      position: "relative",
      display: "grid",
      gap: "5",
      width: "full",
      maxWidth: "dialog",
      p: "clamp(1.75rem, 5vw, 2.5rem)",
      bg: "bg.elevated",
      borderRadius: "card",
      boxShadow: "elevated",
      outline: "none",
      _open: { animationStyle: "scale-in" },
      _closed: { animationStyle: "fade-out" },
    },
    title: { textStyle: "heading.lg", textAlign: "center", m: "0" },
    description: {
      m: "0",
      mt: "-0.6rem",
      mb: "0.4rem",
      textAlign: "center",
      color: "fg.muted",
      fontSize: "0.92rem",
    },
    body: { display: "grid", gap: "5" },
    // 左（やめる）と右（主な操作）を 1 : 1.4 の幅で並べる
    footer: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "3" },
    closeTrigger: { position: "absolute", top: "3", right: "3" },
  },
  variants: {
    size: {
      sm: { content: { maxWidth: "dialog", p: "6" } },
      md: { content: { maxWidth: "dialog" } },
      lg: { content: { maxWidth: "md" } },
    },
    // スマホでは画面下からのシートにする（退出の確認など、中央のままにする窓は false）
    sheet: {
      true: {
        positioner: { "@media (max-width: 560px)": { alignItems: "flex-end", p: "0" } },
        content: {
          "@media (max-width: 560px)": {
            maxWidth: "full",
            maxHeight: "90svh",
            pt: "6",
            px: "4",
            pb: "max(16px, env(safe-area-inset-bottom, 0px))",
            borderRadius: "20px 20px 0 0",
            _open: { animationStyle: "sheet-up" },
            // つまみ
            _before: {
              content: '""',
              justifySelf: "center",
              width: "40px",
              height: "5px",
              mt: "-0.6rem",
              mb: "-0.4rem",
              borderRadius: "control",
              bg: "border.default",
            },
            "& button": { minHeight: "52px", py: "0" },
          },
        },
      },
      false: {},
    },
    // トップの「ルームに参加」は、カードより詰めた余白と小さめの見出しにする
    density: {
      card: {},
      compact: {
        positioner: { "@media (max-width: 560px)": { alignItems: "flex-end", p: "0" } },
        content: {
          gap: "4",
          p: "clamp(1.5rem, 5vw, 2.25rem)",
          "@media (max-width: 560px)": {
            maxWidth: "full",
            pt: "0.75rem",
            px: "4",
            pb: "max(16px, env(safe-area-inset-bottom))",
            borderRadius: "24px 24px 0 0",
            _open: { animationStyle: "sheet-up" },
            // つまみ
            _before: {
              content: '""',
              justifySelf: "center",
              width: "40px",
              height: "5px",
              mb: "0.25rem",
              borderRadius: "control",
              bg: "border.default",
            },
          },
        },
        title: { textStyle: "heading.md" },
        description: { mt: "-0.5rem", mb: "0", color: "fg.description", fontSize: "0.88rem" },
        body: { gap: "4" },
        footer: {
          gridTemplateColumns: "1fr 1.5fr",
          "@media (max-width: 560px)": { "& button": { minHeight: "52px" } },
        },
      },
    },
  },
  defaultVariants: { size: "md", density: "card", sheet: false },
});
