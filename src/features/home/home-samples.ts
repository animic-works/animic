/**
 * ギャラリーの例。お題と、それを再現して提出した1枚、その再現度（total）。
 * 画像はメタデータと透過を除いたWebPで、点数（指標ごとの点と再現度）は試験採点の結果。
 */
export const matches = [
  {
    level: "かんたん",
    rule: "背景なし・1キャラクター",
    score: 59.3,
    topic: {
      src: "/images/gallery-c12-topic.webp",
      alt: "お題。日傘を持ち、ロリータ服を着た金髪縦ロールの女の子",
    },
    shot: {
      src: "/images/gallery-c12-shot.webp",
      alt: "提出。日傘を持った金髪で青い目の女の子",
    },
    metrics: { ccip: 57.4, pixai: 37.8, siglip2: 94.8, dinov2: 54.0, depth: 53.8 },
  },
  {
    level: "ふつう",
    rule: "背景あり・1キャラクター",
    score: 75.0,
    topic: {
      src: "/images/gallery-librarian-topic.webp",
      alt: "お題。図書館で本を持つ、眼鏡をかけた茶髪の女の子",
    },
    shot: {
      src: "/images/gallery-librarian-shot.webp",
      alt: "提出。図書館で本を持つ、眼鏡をかけた女の子",
    },
    metrics: { ccip: 74.5, pixai: 58.0, siglip2: 96.6, dinov2: 78.0, depth: 72.8 },
  },
  {
    level: "むずかしい",
    rule: "背景あり・2キャラクター",
    score: 65.3,
    topic: {
      src: "/images/gallery-aquarium-topic.webp",
      alt: "お題。水族館の水槽の前で魚を見る2人の女の子",
    },
    shot: {
      src: "/images/gallery-aquarium-shot.webp",
      alt: "提出。水族館の水槽の前にいる2人の女の子",
    },
    metrics: { ccip: 71.2, pixai: 41.1, siglip2: 93.4, dinov2: 63.2, depth: 51.6 },
  },
  {
    level: "かんたん",
    rule: "背景なし・1キャラクター",
    score: 76.3,
    topic: {
      src: "/images/gallery-c93-topic.webp",
      alt: "お題。デニムジャケットを着た、青い髪の女の子",
    },
    shot: {
      src: "/images/gallery-c93-shot.webp",
      alt: "提出。デニムジャケットを着た、青い髪の女の子",
    },
    metrics: { ccip: 84.2, pixai: 54.8, siglip2: 93.6, dinov2: 79.9, depth: 63.7 },
  },
  {
    level: "ふつう",
    rule: "背景あり・1キャラクター",
    score: 82.5,
    topic: {
      src: "/images/gallery-picnic-topic.webp",
      alt: "お題。桜の下でサンドイッチを食べる、三つ編みの女の子",
    },
    shot: {
      src: "/images/gallery-picnic-shot.webp",
      alt: "提出。桜の下でピクニックをする、三つ編みの女の子",
    },
    metrics: { ccip: 89.4, pixai: 61.1, siglip2: 94.6, dinov2: 80.8, depth: 89.9 },
  },
  {
    level: "むずかしい",
    rule: "背景あり・2キャラクター",
    score: 72.4,
    topic: {
      src: "/images/gallery-snow-angel-topic.webp",
      alt: "お題。雪原で遊ぶ2人の女の子",
    },
    shot: {
      src: "/images/gallery-snow-angel-shot.webp",
      alt: "提出。雪原で遊ぶ2人の女の子",
    },
    metrics: { ccip: 81.9, pixai: 53.3, siglip2: 95.8, dinov2: 80.9, depth: 32.1 },
  },
] as const;
