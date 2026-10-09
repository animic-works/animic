export const levels = {
  easy: {
    label: "かんたん",
    word: "EASY",
    description: "背景なし ｜ 1キャラクター",
    image: "/images/sample-solo-white-bg.png",
  },
  normal: {
    label: "ふつう",
    word: "NORMAL",
    description: "背景あり ｜ 1キャラクター",
    image: "/images/sample-solo-with-bg.png",
  },
  hard: {
    label: "むずかしい",
    word: "HARD",
    description: "背景あり ｜ 2キャラクター",
    image: "/images/sample-duo-with-bg.png",
  },
} as const;
export const playerPalettes = ["pink", "cyan", "yellow", "rose", "sky", "cream", "gray"] as const;
