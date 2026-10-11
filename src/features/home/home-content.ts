export const steps = [
  {
    title: "ルームに集まる",
    description:
      "「スタート」でルームを作って、相手を招待できます。ルーム作成画面で難易度と制限時間を設定することができます。",
    illustration: "room",
    tone: "secondary",
  },
  {
    title: "お題が公開される",
    description: "ゲームを開始すると、難易度に応じてお題のイラストが公開されます。",
    illustration: "image",
    tone: "primary",
  },
  {
    title: "プロンプトで生成",
    description:
      "日本語の文章でOK。よく使う表現は選択肢から、慣れたらDanbooruタグでも。時間内なら何度でも生成できます。",
    illustration: "prompt",
    tone: "highlight",
  },
  {
    title: "1枚を提出して勝負",
    description:
      "生成した中からいちばん似ている1枚を提出。AIが採点して、最終スコアがいちばん高い人の勝ちです。",
    illustration: "trophy",
    tone: "secondary",
  },
] as const;

/**
 * 採点方法の各要素。計算式が決まるまで、再現度だけを最終スコアにし、
 * 提出速度と生成回数は加えない（docs/product.md）。
 */
export const scoringSteps = [
  {
    title: "再現度で勝負",
    description: "AIがお題と提出を見比べて0〜100点で採点。これがそのまま最終スコアです。",
    illustration: "similarity",
    upcoming: false,
  },
  {
    title: "提出速度",
    description:
      "制限時間内に早く提出するほど加点する予定です。時間切れの後に提出した1枚は、加点の対象になりません。",
    illustration: "speed",
    upcoming: true,
  },
  {
    title: "生成回数",
    description:
      "少ない生成回数で仕上げるほど有利になる予定です。数えるのは提出までに成功した生成で、失敗した生成は数えません。",
    illustration: "attempts",
    upcoming: true,
  },
] as const;
