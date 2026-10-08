import * as v from "valibot";

import { difficultySchema } from "./battle-state";
import { topicIdSchema } from "./topic-images";

const topicStatuses = ["published", "unpublished"] as const;
export type TopicStatus = (typeof topicStatuses)[number];

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  published: "公開中",
  unpublished: "非公開",
};

/** 1つの難易度で公開するお題の目安（docs/product.md）。 */
export const TOPIC_GOAL = 100;

/** 画像を選ぶときの条件。ブラウザーでWebPに変換する前のファイルに使う。 */
export const topicSourceImageTypes = ["image/png", "image/webp", "image/jpeg"];
export const maxTopicSourceBytes = 10 * 1024 * 1024;

export const topicTitleSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(60, "題名は60文字以内で入力してください。"),
);
export const topicNoteSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(1000, "備考は1000文字以内で入力してください。"),
);
export const topicStatusSchema = v.picklist(topicStatuses);

/** 管理画面で扱うお題の全項目。書き出し・読み込みの形式にも使う。 */
export const adminTopicSchema = v.object({
  id: topicIdSchema,
  difficulty: difficultySchema,
  imageUrl: v.pipe(v.string(), v.url()),
  imageKey: v.nullable(v.string()),
  title: topicTitleSchema,
  note: topicNoteSchema,
  status: topicStatusSchema,
  createdAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  updatedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
});
export type AdminTopic = v.InferOutput<typeof adminTopicSchema>;

export const topicFieldsSchema = v.object({
  id: topicIdSchema,
  difficulty: difficultySchema,
  title: topicTitleSchema,
  note: topicNoteSchema,
});
