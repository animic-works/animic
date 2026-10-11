import type { MouseEvent } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Grid } from "@animic/react/grid";
import { Link } from "@animic/react/link";
import { Media } from "@animic/react/media";
import { Meter } from "@animic/react/meter";
import { Notice } from "@animic/react/notice";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { DIFFICULTIES } from "../battle/battle-labels";
import { toImageSrc } from "../battle/image-src";
import { TOPIC_GOAL, type TopicStatus } from "../battle/topic-admin";
import type { listAdminTopics } from "../battle/topic-admin.functions";
import { formatDate } from "./admin-format";
import { AdminHead } from "./admin-parts";
import {
  DIFFICULTY_FILTER_OPTIONS,
  DifficultyBadge,
  STATUS_FILTER_OPTIONS,
  StatusBadge,
  type Difficulty,
} from "./topic-labels";
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
    <Stack space="section">
      <AdminHead
        eyebrow="Admin"
        title="お題"
        actions={<Button onClick={onAdd}>お題を追加</Button>}
      />
      <section aria-label="難易度ごとの公開中のお題">
        <Grid columns={3}>
          {DIFFICULTIES.map((difficulty) => (
            <Surface key={difficulty.value} appearance="card">
              <Stack space="compact">
                <Text variant="label">{difficulty.label}</Text>
                <Text>
                  公開中 {data.publishedByDifficulty[difficulty.value]} / 目安 {TOPIC_GOAL}
                </Text>
                <Meter
                  label={`${difficulty.label}の公開状況`}
                  value={Math.min(
                    100,
                    (data.publishedByDifficulty[difficulty.value] / TOPIC_GOAL) * 100,
                  )}
                />
              </Stack>
            </Surface>
          ))}
        </Grid>
      </section>
      <div role="search" aria-label="お題の絞り込み">
        <Stack>
          <SegmentedControl
            label="状態"
            labelVisibility="visible"
            options={STATUS_FILTER_OPTIONS}
            value={search.status ?? ""}
            onValueChange={(value) => onSearchChange({ ...search, status: statusOf(value) })}
          />
          <SegmentedControl
            label="難易度"
            labelVisibility="visible"
            tone="accent"
            options={DIFFICULTY_FILTER_OPTIONS}
            value={search.difficulty ?? ""}
            onValueChange={(value) =>
              onSearchChange({ ...search, difficulty: difficultyFilterOf(value) })
            }
          />
        </Stack>
      </div>
      <Cluster justify="between">
        <div role="status">
          <Text>{filtered ? `${shown}件を表示` : `${shown}件`}</Text>
        </div>
        <Text variant="caption">更新日時の新しい順</Text>
      </Cluster>
      {shown === 0 ? (
        <Notice
          title={filtered ? "条件に合うお題がありません" : "お題がまだありません"}
          actions={
            <Button
              appearance="secondary"
              onClick={() => (filtered ? onSearchChange({}) : onAdd())}
            >
              {filtered ? "条件を外す" : "最初のお題を追加"}
            </Button>
          }
        >
          {filtered ? "条件を変えて確認してください。" : "お題の画像を追加してください。"}
        </Notice>
      ) : (
        <section aria-label="お題">
          <Grid columns={3}>
            {topics.map((topic) => (
              <Surface key={topic.id} appearance="card" padding="md">
                <Link
                  href={`/admin/topics/${encodeURIComponent(topic.id)}`}
                  aria-label={`${topic.title || topic.id}の詳細`}
                  onClick={(event) => openOnClick(event, () => onOpen(topic.id))}
                >
                  <Stack space="compact">
                    <Media
                      src={toImageSrc(topic.imageUrl)}
                      alt=""
                      aspect="portrait"
                      fit="contain"
                    />
                    <Cluster>
                      <StatusBadge status={topic.status} />
                      <DifficultyBadge difficulty={topic.difficulty} />
                    </Cluster>
                    <Text variant="label">{topic.title || topic.id}</Text>
                    <Text variant="caption">
                      {metaText(topic.note)}・{topic.updatedAt ? formatDate(topic.updatedAt) : "—"}
                    </Text>
                  </Stack>
                </Link>
              </Surface>
            ))}
          </Grid>
        </section>
      )}
    </Stack>
  );
}
