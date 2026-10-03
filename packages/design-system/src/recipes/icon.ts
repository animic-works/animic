import { defineRecipe } from "@pandacss/dev";

// 線で描いたアイコン。色は文字色を受け継ぎ、大きさだけを段階で選ぶ
export const icon = defineRecipe({
  className: "icon",
  description: "ボタンや見出しに添える線画のアイコン。単独で意味を持たせず、文言と一緒に使う",
  base: { display: "inline-block", flexShrink: "0", height: "auto", verticalAlign: "middle" },
  variants: {
    size: {
      // 「戻る」「ログインせずに進む」の山形
      "2xs": { width: "0.625rem" },
      // トップの大きなボタンの山形
      xs: { width: "0.75rem" },
      // カルーセルの矢印・選んだ画像のチェック
      sm: { width: "0.875rem" },
      // 「招待する」「結果をシェア」の人影・X
      md: { width: "1rem" },
      // 「生成する」のきらめき
      lg: { width: "1.125rem" },
      // 勝者の冠
      xl: { width: "1.25rem" },
      // ログイン連携先のロゴ
      "2xl": { width: "1.4rem" },
      // 「スタート」の再生
      "3xl": { width: "1.625rem" },
      // スコアのカードのアイコン
      "4xl": { width: "1.75rem" },
      // 「ルームに参加する」の人影・ギャラリーの画像の印
      "5xl": { width: "2.125rem" },
    },
  },
  defaultVariants: { size: "sm" },
});

// アイコンだけの丸いボタン（カルーセルの矢印・ページの先頭へ）
export const iconButton = defineRecipe({
  className: "icon-button",
  description: "アイコンだけの丸いボタン。読み上げ用の名前（aria-label）を必ず付ける",
  base: {
    display: "grid",
    placeItems: "center",
    flexShrink: "0",
    p: "0",
    borderRadius: "full",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "bg.surface",
    color: "fg.default",
    cursor: "pointer",
    transitionProperty: "transform, box-shadow, background-color, color",
    transitionDuration: "fast",
    transitionTimingFunction: "standard",
    _disabled: { cursor: "default", color: "fg.subtle", borderColor: "border.default" },
  },
  variants: {
    variant: {
      // ステッカーのような紺の硬い影。押すと沈み、乗せるとピンクになる
      sticker: {
        width: "3.2rem",
        height: "3.2rem",
        borderWidth: "heavy",
        boxShadow: "stickerXs",
        _hoverable: { _hover: { bg: "accent.default", color: "accent.fg" } },
        _active: { transform: "translateY(4px)", boxShadow: "0 1px 0 #0b1b2b" },
      },
      // 淡い縁とやわらかい影。乗せるとピンク、押すと少し縮む（トップのカルーセルの矢印）
      soft: {
        width: "3.2rem",
        height: "3.2rem",
        borderWidth: "thick",
        borderColor: "border.default",
        boxShadow: "surface",
        _hoverable: {
          _hover: { bg: "accent.default", color: "accent.fg", borderColor: "accent.default" },
        },
        _active: { transform: "scale(0.94)" },
        smDown: { width: "48px", height: "48px" },
        "@media (max-width: 560px) and (max-height: 700px)": { width: "44px", height: "44px" },
      },
      // 画面の端に浮かせる（ページの先頭へ）
      float: {
        width: "12",
        height: "12",
        borderWidth: "thick",
        boxShadow: "float",
      },
    },
  },
  defaultVariants: { variant: "sticker" },
});
