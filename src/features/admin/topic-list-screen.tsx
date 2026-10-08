import type { MouseEvent } from "react";

import { Button } from "../../components/button";
import { EmptyState } from "../../components/empty-state";
import { Icon } from "../../components/icon";
import { SegmentedControl } from "../../components/segmented-control";
import { DIFFICULTIES } from "../battle/battle-labels";
import { TOPIC_GOAL } from "../battle/topic-admin";
import type { TopicStatus } from "../battle/topic-admin";
import type { listAdminTopics } from "../battle/topic-admin.functions";
import { formatDate } from "./admin-format";
import {
  AdminHead,
  FilterBar,
  FilterGroup,
  ListSummary,
  SummaryTiles,
  TopicGrid,
  TopicTile,
} from "./admin-parts";
import {
  DIFFICULTY_FILTER_OPTIONS,
  DifficultyBadge,
  STATUS_FILTER_OPTIONS,
  StatusBadge,
} from "./topic-labels";
import type { Difficulty } from "./topic-labels";

export type TopicListSearch = { status?: TopicStatus; difficulty?: Difficulty };

export type TopicListScreenProps = {
  data: Awaited<ReturnType<typeof listAdminTopics>>;
  search: TopicListSearch;
  onSearchChange: (search: TopicListSearch) => void;
  onOpen: (topicId: string) => void;
  onAdd: () => void;
};

function statusOf(value: string): TopicStatus | undefined {
  return value === "published" || value === "unpublished" ? value : undefined;
}
function difficultyFilterOf(value: string): Difficulty | undefined {
  return value === "easy" || value === "normal" || value === "hard" ? value : undefined;
}

// 備考の1行目を短く。空なら「備考なし」
function metaText(note: string) {
  const firstLine = note.split("\n")[0].trim();
  if (!firstLine) return "備考なし";
  return firstLine.length > 20 ? `${firstLine.slice(0, 20)}…` : firstLine;
}

// 修飾キー・左以外のクリックは、別タブで開くなどの既定の動きに任せる
function openOnClick(event: MouseEvent<HTMLAnchorElement>, open: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
    return;
  event.preventDefault();
  open();
}

// お題の一覧: 難易度ごとの公開中の数・絞り込み・タイル
export function TopicListScreen({
  data,
  search,
  onSearchChange,
  onOpen,
  onAdd,
}: TopicListScreenProps) {
  const filtered = Boolean(search.status || search.difficulty);
  const topics = data.topics.filter(
    (topic) =>
      (!search.status || topic.status === search.status) &&
      (!search.difficulty || topic.difficulty === search.difficulty),
  );
  const shown = topics.length;

  return (
    <>
      <AdminHead
        eyebrow="Admin"
        title="お題"
        actions={
          <Button leadingIcon={<Icon name="plus" size="md" />} onClick={onAdd}>
            お題を追加
          </Button>
        }
      />
      <SummaryTiles
        label="難易度ごとの公開中のお題"
        items={DIFFICULTIES.map((difficulty) => ({
          label: difficulty.label,
          count: data.publishedByDifficulty[difficulty.value],
          goal: TOPIC_GOAL,
        }))}
      />
      <FilterBar label="お題の絞り込み">
        <FilterGroup label="状態">
          <SegmentedControl
            label="状態"
            variant="lift"
            options={STATUS_FILTER_OPTIONS}
            value={search.status ?? ""}
            onValueChange={(value) => onSearchChange({ ...search, status: statusOf(value) })}
          />
        </FilterGroup>
        <FilterGroup label="難易度">
          <SegmentedControl
            label="難易度"
            variant="lift"
            tone="accent"
            options={DIFFICULTY_FILTER_OPTIONS}
            value={search.difficulty ?? ""}
            onValueChange={(value) =>
              onSearchChange({ ...search, difficulty: difficultyFilterOf(value) })
            }
          />
        </FilterGroup>
      </FilterBar>
      <ListSummary
        count={filtered ? `${shown}件を表示` : `${shown}件`}
        order="更新日時の新しい順"
      />
      {shown === 0 ? (
        filtered ? (
          <EmptyState
            title="条件に合うお題がありません"
            actions={
              <Button variant="secondary" onClick={() => onSearchChange({})}>
                条件を外す
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="お題がまだありません"
            actions={
              <Button variant="secondary" onClick={onAdd}>
                最初のお題を追加
              </Button>
            }
          />
        )
      ) : (
        <TopicGrid label="お題">
          {topics.map((topic) => (
            <TopicTile
              key={topic.id}
              href={`/admin/topics/${encodeURIComponent(topic.id)}`}
              onOpen={(event) => openOnClick(event, () => onOpen(topic.id))}
              imageSrc={topic.imageUrl}
              title={topic.title}
              fallbackTitle={topic.id}
              status={<StatusBadge status={topic.status} />}
              difficulty={<DifficultyBadge difficulty={topic.difficulty} />}
              meta={metaText(topic.note)}
              // 移行前から登録されていたお題は更新日時が0（不明）のため、詳細画面と同じく「—」にする
              date={topic.updatedAt ? formatDate(topic.updatedAt) : "—"}
              dateTime={topic.updatedAt ? new Date(topic.updatedAt).toISOString() : undefined}
            />
          ))}
        </TopicGrid>
      )}
    </>
  );
}
