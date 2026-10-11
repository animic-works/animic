import * as v from "valibot";

import { difficultySchema } from "../battle/battle-state";
import { scoringMetrics } from "../scoring/scoring-metrics";
import type { ScoringWeights } from "../scoring/scoring-metrics";
import type { ScoreBonus } from "../scoring/final-score";

// トップページの遊び方・採点方法・ギャラリーとOGP画像。運営者が管理画面で編集し、D1から読む。
// 遊び方・採点方法は項目の数と順番を固定し、編集していない項目はここの既定の文言を使う。

/** 遊び方の手順。`illustration`は画像を登録していないときに出すイラスト */
export const howSteps = [
  {
    id: "how-1",
    title: "ルームに集まる",
    description:
      "「スタート」でルームを作って、相手を招待できます。ルーム作成画面で難易度と制限時間を設定することができます。",
    illustration: "room",
  },
  {
    id: "how-2",
    title: "お題が公開される",
    description: "ゲームを開始すると、難易度に応じてお題のイラストが公開されます。",
    illustration: "image",
  },
  {
    id: "how-3",
    title: "プロンプトで生成",
    description:
      "日本語の文章でOK。よく使う表現は選択肢から、慣れたらDanbooruタグでも。時間内なら何度でも生成できます。",
    illustration: "prompt",
  },
  {
    id: "how-4",
    title: "1枚を提出して勝負",
    description:
      "生成した中からいちばん似ている1枚を提出。AIが採点して、最終スコアがいちばん高い人の勝ちです。",
    illustration: "trophy",
  },
] as const;

/**
 * 採点方法の各要素。`bonus`は、その項目が説明するボーナス。再現度の項目（`null`）には重みのグラフを、
 * ボーナスの項目には今のボーナスの点を出し、点が0のボーナスの項目は出さない。
 */
export const scoringSteps = [
  {
    id: "score-1",
    title: "再現度で勝負",
    description: "AIがお題と提出を見比べて0〜100点で採点。最終スコアのいちばん大きな要素です。",
    illustration: "similarity",
    bonus: null,
  },
  {
    id: "score-2",
    title: "提出速度",
    description:
      "制限時間内にいちばん早く提出した人にボーナス。時間切れの後に提出した1枚は、ボーナスの対象になりません。",
    illustration: "speed",
    bonus: "speed",
  },
  {
    id: "score-3",
    title: "生成回数",
    description:
      "いちばん少ない生成回数で提出した人にボーナス。数えるのは提出までに成功した生成で、失敗した生成は数えません。",
    illustration: "attempts",
    bonus: "generation",
  },
] as const;

/** ボーナスの項目に添える、今のボーナスの点。点が0のボーナスは`null`（項目を出さない）。 */
export function bonusNote(kind: "speed" | "generation", bonus: ScoreBonus) {
  const points = kind === "speed" ? bonus.speedPoints : bonus.generationPoints;
  if (points === 0) return null;
  const who = kind === "speed" ? "いちばん早く提出した人" : "いちばん少ない回数で提出した人";
  const target =
    bonus.minSimilarity > 0 ? `再現度${bonus.minSimilarity}点以上の人が対象です。` : "";
  return `${who}に${points}点（同点なら分け合います）。${target}`;
}

const homeItemIds = [...howSteps, ...scoringSteps].map((item) => item.id);
export const homeItemIdSchema = v.picklist(homeItemIds);

/** 管理画面で登録した画像のID。差し替えるたびに変え、配信URLも変える。 */
export const siteImageIdSchema = v.pipe(v.string(), v.uuid());

/** 登録した画像の配信のパス。 */
export function siteImagePath(imageId: string) {
  return `/site-images/${imageId}`;
}

/** パスが登録した画像なら、その画像ID。 */
export function siteImageIdOf(src: string | null): string | null {
  return src?.startsWith("/site-images/") ? src.slice("/site-images/".length) : null;
}

export const homeItemTextSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "題名を入力してください。"),
    v.maxLength(30, "題名は30文字以内で入力してください。"),
  ),
  description: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "本文を入力してください。"),
    v.maxLength(200, "本文は200文字以内で入力してください。"),
  ),
});

const scoreSchema = (label: string) =>
  v.pipe(
    v.number(`${label}を数字で入力してください。`),
    v.minValue(0, `${label}は0〜100で入力してください。`),
    v.maxValue(100, `${label}は0〜100で入力してください。`),
  );

const altSchema = (label: string) =>
  v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, `${label}の説明を入力してください。`),
    v.maxLength(100, `${label}の説明は100文字以内で入力してください。`),
  );

const metricLabel = (key: keyof ScoringWeights) =>
  scoringMetrics.find((metric) => metric.key === key)?.label ?? key;

/** ギャラリーの例の、画像を除く値。点数は小数第1位まで出す */
export const galleryItemTextSchema = v.object({
  difficulty: difficultySchema,
  score: scoreSchema("再現度"),
  metrics: v.object({
    ccip: scoreSchema(metricLabel("ccip")),
    pixai: scoreSchema(metricLabel("pixai")),
    siglip2: scoreSchema(metricLabel("siglip2")),
    dinov2: scoreSchema(metricLabel("dinov2")),
    depth: scoreSchema(metricLabel("depth")),
  }),
  topicAlt: altSchema("お題"),
  shotAlt: altSchema("提出"),
});
export type GalleryItem = v.InferOutput<typeof galleryItemTextSchema> & {
  id: string;
  topicSrc: string;
  shotSrc: string;
};

export type HomeItem = { id: string; title: string; description: string; image: string | null };

/** トップページに出す内容。画像はパス、OGP画像は登録していなければnull */
export type HomeContent = {
  howSteps: HomeItem[];
  scoringSteps: HomeItem[];
  weights: ScoringWeights;
  bonus: ScoreBonus;
  gallery: GalleryItem[];
  ogImage: string | null;
};

/** 保存した項目（ない項目は既定の文言）を、固定の順番で並べる */
export function mergeHomeItems(
  defaults: readonly { id: string; title: string; description: string }[],
  saved: readonly HomeItem[],
): HomeItem[] {
  return defaults.map(
    ({ id, title, description }) =>
      saved.find((item) => item.id === id) ?? { id, title, description, image: null },
  );
}

/** OGP画像の大きさ */
export const ogImageSize = { width: 1200, height: 630 } as const;
