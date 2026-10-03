import { defineRecipe } from "@pandacss/dev";

// ボタン。見た目の種類（variant）・大きさ（size）・横幅いっぱいか（fullWidth）・文言の寄せ（labelAlign）を持つ
export const button = defineRecipe({
  className: "button",
  description: "押して操作するボタン。主な操作は1画面に1つだけprimaryにする",
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    borderRadius: "control",
    borderWidth: "thick",
    borderStyle: "solid",
    borderColor: "transparent",
    fontFamily: "body",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textDecoration: "none",
    userSelect: "none",
    cursor: "pointer",
    transitionProperty: "transform, background-color, border-color, color",
    transitionDuration: "fast",
    transitionTimingFunction: "standard",
    _hoverable: { _hover: { transform: "translateY(-2px)" } },
    _active: { transform: "translateY(1px)" },
    _disabled: { cursor: "default", transform: "none", _hover: { transform: "none" } },
    // 文言と前後のアイコン。文言が残りの幅を使う
    "& [data-part='label']": { minWidth: "0", textAlign: "var(--button-label-align)" },
    "& [data-part='icon']": { flex: "none", display: "inline-flex" },
    // 押した直後に一瞬つぶす（画面遷移の演出の開始時）
    "&[data-pressed]": { animation: "press 0.35s ease" },
  },
  variants: {
    variant: {
      // 主な操作（ピンク）
      primary: {
        bg: "accent.default",
        color: "accent.fg",
        boxShadow: "accent",
        // 押せないときは半透明にせず淡いピンクにする（後ろが透けないように）
        _disabled: { bg: "accent.disabled", boxShadow: "none", _hover: { bg: "accent.disabled" } },
      },
      // 並べて置く副次的な操作（白地に黒の縁）
      secondary: {
        bg: "bg.surface",
        color: "fg.default",
        borderColor: "border.strong",
        _disabled: { color: "fg.subtle", borderColor: "border.default" },
      },
      // 目立たせない操作（キャンセル・閉じる）
      ghost: {
        bg: "transparent",
        color: "fg.muted",
        _hover: { bg: "bg.sunken", color: "fg.default" },
        _disabled: { color: "fg.subtle" },
      },
      // 黒地（シェアなど、ピンクの隣に置く強い操作）
      inverse: {
        bg: "bg.inverse",
        color: "fg.inverse",
        _disabled: { bg: "fg.subtle" },
      },
      // 取り消せない操作（退出・削除）
      destructive: {
        bg: "danger.default",
        color: "fg.inverse",
        _disabled: { bg: "fg.subtle" },
      },
      // 文字だけの小さな操作（「ログイン方法を選び直す」など）
      link: {
        justifySelf: "center",
        p: "0",
        minHeight: "auto",
        borderWidth: "none",
        borderRadius: "xs",
        bg: "transparent",
        color: "fg.muted",
        fontSize: "0.85rem",
        fontWeight: "regular",
        letterSpacing: "normal",
        textDecoration: "underline",
        _hoverable: { _hover: { transform: "none", color: "fg.default" } },
        _active: { transform: "none" },
        "@media (max-width: 560px)": { minHeight: "48px", px: "4" },
      },
      // ログイン連携先（Discord）
      discord: { bg: "brand.discord", color: "fg.inverse", borderColor: "brand.discord" },
    },
    size: {
      // 上部のバーの「退出」
      xs: { py: "0.45rem", px: "1.1rem", fontSize: "0.85rem" },
      // 「招待する」「リンクをコピー」など、カードの中の小さな操作
      sm: { gap: "0.4rem", py: "0.6rem", px: "4", fontSize: "0.85rem" },
      // 小さな窓の操作（トップの「ルームに参加」の「やめる」「参加する」）
      md: { py: "0.9rem", px: "4", fontSize: "md" },
      // 画面の主な操作（ルームを作る・対戦をはじめる・提出する）
      lg: {
        py: "4",
        px: "5",
        fontSize: "1.05rem",
        letterSpacing: "0.05em",
        "@media (max-width: 560px)": { minHeight: "52px", py: "0.8rem" },
      },
      // ログイン連携先のボタン（細い縁）
      provider: {
        py: "0.95rem",
        px: "5",
        fontSize: "md",
        letterSpacing: "0.03em",
        borderWidth: "thin",
        "@media (max-width: 560px)": { minHeight: "52px", py: "0.8rem" },
      },
      // トップの「スタート」「ルームに参加する」
      hero: {
        gap: "4",
        minWidth: "min(100%, 24rem)",
        px: "1.8rem",
        py: "1.2rem",
        fontSize: "clamp(1.1rem, 1.8vw, 1.45rem)",
        letterSpacing: "0.06em",
        borderWidth: "thick",
        "& [data-part='label']": { flex: "1" },
        // スマホ: 1行に2つ並べ、文言を中央に、右端の山形は端に寄せる
        "@media (max-width: 560px)": {
          width: "full",
          minWidth: "0",
          minHeight: "56px",
          px: "0.9rem",
          py: "0",
          gap: "2",
          justifyContent: "center",
          fontSize: "md",
          "& [data-part='icon']:first-child svg": { width: "20px", height: "22px" },
          "& [data-part='icon']:last-child": {
            ml: "auto",
            "& svg": { width: "9px", height: "15px" },
          },
          "& [data-part='label']": { flex: "none", ml: "auto", textAlign: "center" },
        },
        // 幅の狭い画面: 右端の山形を省く
        "@media (max-width: 400px)": {
          "& [data-part='icon']:last-child": { display: "none" },
          "& [data-part='label']": { mr: "auto" },
        },
        "@media (max-width: 359px)": { px: "0.6rem" },
      },
    },
    fullWidth: {
      true: { width: "full" },
      false: {},
    },
    // 文言が残りの幅を使い、前後のアイコンを両端に置く（ログイン連携先のボタン）
    spread: {
      true: { "& [data-part='label']": { flex: "1" } },
      false: {},
    },
    labelAlign: {
      start: { "--button-label-align": "start" },
      center: { "--button-label-align": "center" },
    },
  },
  compoundVariants: [
    // トップの大きなピンクのボタンは、光の輪を少し強くし、縁を付けない
    {
      variant: "primary",
      size: "hero",
      css: {
        borderWidth: "none",
        boxShadow: "glowStrong",
        "@media (max-width: 560px)": {
          boxShadow: "0 0 0 4px rgb(255 45 135 / 0.16), 0 10px 22px -10px rgb(255 45 135 / 0.7)",
        },
      },
    },
    // Googleでログイン: 白地に細いグレーの縁
    { variant: "secondary", size: "provider", css: { borderColor: "border.provider" } },
    // 「ルームに参加する」: スマホでは8字がボタン内に必ず収まるよう、字間を詰める
    {
      variant: "secondary",
      size: "hero",
      css: {
        "@media (max-width: 560px)": {
          "& [data-part='icon']:first-child svg": { width: "24px", height: "18px" },
          "& [data-part='label']": {
            fontSize: "0.88rem",
            letterSpacing: "normal",
            whiteSpace: "nowrap",
          },
        },
        "@media (max-width: 359px)": {
          "& [data-part='icon']:first-child": { display: "none" },
          "& [data-part='label']": { fontSize: "0.82rem" },
        },
      },
    },
    // 小さなピンクのボタン（ナビ・招待）は影を軽くする
    { variant: "primary", size: "sm", css: { boxShadow: "glowSoft" } },
  ],
  defaultVariants: {
    variant: "primary",
    size: "lg",
    fullWidth: false,
    spread: false,
    labelAlign: "center",
  },
});
