import { defineRecipe } from "@pandacss/dev";

// 文字。文字の組み合わせ（variant）・色の意味（tone）・揃え（align）を持つ
export const text = defineRecipe({
  className: "text",
  description: "本文・見出し・注記などの文字。大きさや書体を直接指定せず、variantで選ぶ",
  base: { m: "0", minWidth: "0", overflowWrap: "anywhere" },
  variants: {
    variant: {
      display: { textStyle: "display.lg" },
      // 見出し・数字に使う小さめの表示用の書体（ロビーの「プレイヤー」「ルームコード」など）
      "display-sm": { textStyle: "display.sm" },
      // トップのキャッチコピー。少し傾け、強調（em）の下にピンクの線を引く
      "hero-title": {
        textStyle: "hero",
        mt: "0.4rem",
        ml: "clamp(0rem, 1vw, 0.5rem)",
        transform: "rotate(-4deg) skewX(-6deg)",
        transformOrigin: "left center",
        // 白いフチで背景の上でも読めるようにする
        textShadow: "0 2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff, 0 -2px 0 #fff",
        "& > span": { display: "block" },
        "& > span + span": { pl: "1.1em" },
        // 「一枚」はピンク、「近づける」は水色。2行目の下にはピンクの長い線を引く
        "& b": { fontWeight: "inherit", color: "accent.default" },
        "& em": {
          position: "relative",
          fontStyle: "normal",
          whiteSpace: "nowrap",
          color: "info.default",
        },
        "& em::after": {
          content: '""',
          position: "absolute",
          left: "-2.6em",
          right: "-1.4em",
          bottom: "-0.14em",
          height: "0.1em",
          borderRadius: "1em",
          bg: "accent.default",
          transform: "rotate(-2deg)",
        },
        // 縦向きのタブレット
        "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)": {
          position: "relative",
          zIndex: "raised",
          alignSelf: "flex-start",
          fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
        },
        // スマホ: 1行目は左、2行目は右にずらして画面幅いっぱいに
        "@media (max-width: 560px)": {
          position: "relative",
          zIndex: "raised",
          mt: "-1.2rem",
          ml: "0",
          // 2行目（字下げ1.2字＋9字）が左右16pxの余白の内側に収まる大きさ
          fontSize: "clamp(1.5rem, calc((100vw - 32px) / 10.5), 2.6rem)",
          lineHeight: "1.25",
          whiteSpace: "nowrap",
          "& > span + span": { pl: "1.2em" },
        },
        "@media (max-width: 560px) and (max-height: 700px)": { mt: "0" },
      },
      // トップの説明文。文節の途中で折り返さないよう、span を inline-block にする
      lead: {
        textStyle: "lead",
        maxWidth: "30em",
        mt: "clamp(1rem, 3vh, 1.8rem)",
        ml: "0.6rem",
        "& > span": { display: "inline-block" },
        "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)": {
          position: "relative",
          zIndex: "raised",
          mt: "1.2rem",
        },
        // スマホ: 左にピンク→水色の縦線。1文目は説明として控えめに、2文目の「勝ち」を強く。
        // 要所には蛍光ペンのような下線を引く
        "@media (max-width: 560px)": {
          position: "relative",
          zIndex: "raised",
          mt: "1.1rem",
          ml: "0.2rem",
          pl: "0.9rem",
          fontSize: "0.86rem",
          lineHeight: "1.8",
          letterSpacing: "0.03em",
          color: "fg.description",
          _before: {
            content: '""',
            position: "absolute",
            inset: "0.25rem auto 0.25rem 0",
            width: "4px",
            borderRadius: "4px",
            background: "linear-gradient(token(colors.accent.default), token(colors.info.default))",
          },
          "& span:nth-of-type(2)": { color: "accent.default", fontWeight: "heavy" },
          "& span:nth-of-type(n + 4)": {
            mt: "0.15rem",
            fontSize: "1.02rem",
            fontWeight: "heavy",
            letterSpacing: "0.02em",
            color: "fg.default",
          },
          "& span:nth-of-type(5)": {
            background:
              "linear-gradient(transparent 62%, rgb(253 219 19 / 0.75) 62% 92%, transparent 92%)",
          },
        },
        // 低い画面では説明文は「遊び方」にあるので省く
        "@media (max-width: 560px) and (max-height: 700px)": { display: "none" },
      },
      // 節の見出し（「遊び方」「採点方法」）
      "section-title": { textStyle: "section" },
      // 勝敗の見出し（YOU WIN!）。少し傾け、白とピンクの影をずらして重ねる
      verdict: {
        textStyle: "verdict",
        transform: "rotate(-4deg) skewX(-6deg)",
        textShadow: "4px 4px 0 #fff, 8px 8px 0 var(--verdict-shadow, #ff72b9)",
      },
      "heading-lg": { textStyle: "heading.lg" },
      "heading-md": { textStyle: "heading.md" },
      "heading-sm": { textStyle: "heading.sm" },
      body: { textStyle: "body.md" },
      "body-sm": { textStyle: "body.sm" },
      label: { textStyle: "label" },
      note: { textStyle: "note" },
      caption: { textStyle: "caption" },
      eyebrow: { textStyle: "eyebrow", color: "accent.default" },
      code: { textStyle: "code" },
    },
    tone: {
      default: { color: "fg.default" },
      muted: { color: "fg.muted" },
      subtle: { color: "fg.subtle" },
      faint: { color: "fg.faint" },
      accent: { color: "accent.default" },
      // ブランドの色そのもの（大きな表示用の文字にだけ使う）
      brand: { color: "accent.brand" },
      success: { color: "success.strong" },
      warning: { color: "warning.default" },
      danger: { color: "danger.default" },
      inverse: { color: "fg.inverse" },
    },
    align: {
      start: { textAlign: "start" },
      center: { textAlign: "center" },
      end: { textAlign: "end" },
    },
    // 勝ち以外の見出しは影を水色にする
    shadow: {
      pink: { "--verdict-shadow": "token(colors.accent.muted)" },
      cyan: { "--verdict-shadow": "token(colors.info.default)" },
    },
  },
  defaultVariants: { variant: "body", align: "start" },
});
