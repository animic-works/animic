import { defineTextStyles } from "@pandacss/dev";

// 文字の組み合わせ。書体・大きさ・太さ・行の高さ・字間をまとめて選ぶ
export const textStyles = defineTextStyles({
  // 勝敗・順位など、いちばん目立たせる数字や言葉
  display: {
    lg: {
      value: {
        fontFamily: "display",
        fontSize: "4xl",
        fontWeight: "regular",
        lineHeight: "none",
        letterSpacing: "normal",
      },
    },
    // ロビーの「ルームコード」「プレイヤー」「ルール」などの見出し
    sm: {
      value: {
        fontFamily: "display",
        fontSize: "1.3rem",
        fontWeight: "regular",
        lineHeight: "normal",
        letterSpacing: "normal",
      },
    },
  },
  // トップのキャッチコピー。画面の幅と高さに合わせて大きさを変える
  hero: {
    value: {
      fontFamily: "display",
      fontSize: "clamp(1.9rem, min(5vw, 7.5vh), 4rem)",
      fontWeight: "regular",
      lineHeight: "1.35",
      letterSpacing: "0.01em",
    },
  },
  // トップの説明文
  lead: {
    value: {
      fontFamily: "body",
      fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
      fontWeight: "bold",
      lineHeight: "1.85",
      letterSpacing: "normal",
    },
  },
  // 節の見出し
  section: {
    value: {
      fontFamily: "display",
      fontSize: "clamp(2rem, 4.2vw, 3rem)",
      fontWeight: "regular",
      lineHeight: "1.3",
      letterSpacing: "normal",
    },
  },
  // 勝敗の見出し
  verdict: {
    value: {
      fontFamily: "display",
      fontSize: "clamp(3rem, 10vw, 6.5rem)",
      fontWeight: "regular",
      lineHeight: "1.1",
      letterSpacing: "normal",
    },
  },
  heading: {
    // カードの見出し（「ログインしてはじめよう」「友だちを招待」）
    lg: {
      value: {
        fontFamily: "round",
        fontSize: "clamp(1.5rem, 4.5vw, 1.8rem)",
        fontWeight: "heavy",
        lineHeight: "normal",
        letterSpacing: "0.02em",
      },
    },
    // 小さな窓の見出し（トップの「ルームに参加」）
    md: {
      value: {
        fontFamily: "round",
        fontSize: "1.5rem",
        fontWeight: "heavy",
        lineHeight: "normal",
        letterSpacing: "normal",
      },
    },
    sm: {
      value: {
        fontFamily: "round",
        fontSize: "lg",
        fontWeight: "heavy",
        lineHeight: "normal",
        letterSpacing: "normal",
      },
    },
  },
  body: {
    md: {
      value: {
        fontFamily: "body",
        fontSize: "md",
        fontWeight: "regular",
        lineHeight: "normal",
        letterSpacing: "normal",
      },
    },
    sm: {
      value: {
        fontFamily: "body",
        fontSize: "sm",
        fontWeight: "regular",
        lineHeight: "normal",
        letterSpacing: "normal",
      },
    },
  },
  // 入力欄の項目名など、短い操作の言葉
  label: {
    value: {
      fontFamily: "body",
      fontSize: "0.88rem",
      fontWeight: "bold",
      lineHeight: "normal",
      letterSpacing: "normal",
    },
  },
  // パネルの中の短い補足（お題の下の説明）
  note: {
    value: {
      fontFamily: "body",
      fontSize: "0.82rem",
      fontWeight: "regular",
      lineHeight: "normal",
      letterSpacing: "normal",
    },
  },
  // 入力欄の補足・注記
  caption: {
    value: {
      fontFamily: "body",
      fontSize: "0.78rem",
      fontWeight: "regular",
      lineHeight: "normal",
      letterSpacing: "normal",
    },
  },
  // 見出しの上に置く英字の小見出し（例: HOW TO PLAY）
  eyebrow: {
    value: {
      fontFamily: "latin",
      fontSize: "0.8rem",
      fontWeight: "regular",
      fontStyle: "italic",
      lineHeight: "1.8",
      letterSpacing: "0.28em",
    },
  },
  // ルームコード・タグ・点数など、桁をそろえたい文字
  code: {
    value: {
      fontFamily: "mono",
      fontSize: "md",
      fontWeight: "bold",
      lineHeight: "none",
      letterSpacing: "wider",
    },
  },
});
