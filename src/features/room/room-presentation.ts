export const levels = {
  easy: {
    label: "かんたん",
    word: "EASY",
    description: "背景なし ｜ 1キャラクター",
    image: "/images/gallery-c12-topic.webp",
  },
  normal: {
    label: "ふつう",
    word: "NORMAL",
    description: "背景あり ｜ 1キャラクター",
    image: "/images/gallery-librarian-topic.webp",
  },
  hard: {
    label: "むずかしい",
    word: "HARD",
    description: "背景あり ｜ 2キャラクター",
    image: "/images/gallery-aquarium-topic.webp",
  },
} as const;
export const playerPalettes = ["pink", "cyan", "yellow", "rose", "sky", "cream", "gray"] as const;
