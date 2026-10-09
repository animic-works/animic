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
      "生成した中からいちばん似ている1枚を提出。AIが採点して、最終スコアの高いほうが勝ちです。",
    illustration: "trophy",
    tone: "secondary",
  },
] as const;

export const scoring = [
  {
    title: "再現度",
    icon: "similarity",
    tone: "primary",
    description: "お題にどれだけ近いかをAIが評価します。スコアのいちばん大きな要素です。",
  },
  {
    title: "提出速度",
    icon: "speed",
    tone: "secondary",
    description: "制限時間内に早く提出するほど加点されます。時間切れ後の提出は加点なし。",
  },
  {
    title: "生成回数",
    icon: "attempts",
    tone: "highlight",
    description: "提出までに成功した生成の回数。少ない回数で仕上げるほど有利です。",
  },
] as const;
