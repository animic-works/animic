import { Badge } from "@animic/react/badge";
import { DIFFICULTIES, getDifficulty } from "../battle/battle-labels";
import { TOPIC_STATUS_LABELS } from "../battle/topic-admin";
import type { TopicStatus } from "../battle/topic-admin";

// お題の3画面で使う状態・難易度の札と選択肢。

export type Difficulty = (typeof DIFFICULTIES)[number]["value"];

// 公開状態を共通の成功色と中立色で区別する
export function StatusBadge({ status }: { status: TopicStatus }) {
  if (status === "published")
    return (
      <Badge tone="success" size="sm">
        {TOPIC_STATUS_LABELS.published}
      </Badge>
    );
  return <Badge size="sm">{TOPIC_STATUS_LABELS.unpublished}</Badge>;
}

// 難易度の札
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge size="sm">{getDifficulty(difficulty).label}</Badge>;
}

// 難易度のSegmentedControlの選択肢
export const DIFFICULTY_OPTIONS = DIFFICULTIES.map((item) => ({
  value: item.value,
  label: item.label,
}));

// 絞り込みの選択肢。先頭の「すべて」は value "" で、絞り込みなしを表す
export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "published", label: TOPIC_STATUS_LABELS.published },
  { value: "unpublished", label: TOPIC_STATUS_LABELS.unpublished },
];
export const DIFFICULTY_FILTER_OPTIONS = [{ value: "", label: "すべて" }, ...DIFFICULTY_OPTIONS];

// 選択肢の値を難易度にする。SegmentedControlは文字列を返すため、値を絞り込む
export function difficultyOf(value: string): Difficulty {
  return DIFFICULTIES.find((item) => item.value === value)?.value ?? "normal";
}
