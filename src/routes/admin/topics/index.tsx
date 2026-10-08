import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as v from "valibot";

import { TopicListScreen } from "../../../features/admin/topic-list-screen";
import type { TopicListSearch } from "../../../features/admin/topic-list-screen";
import { difficultySchema } from "../../../features/battle/battle-state";
import { listAdminTopics } from "../../../features/battle/topic-admin.functions";
import { topicStatusSchema } from "../../../features/battle/topic-admin";

// 一覧にない値は絞り込みに使わない。
function pick<T>(schema: v.GenericSchema<unknown, T>, value: unknown) {
  const parsed = v.safeParse(schema, value);
  return parsed.success ? parsed.output : undefined;
}

// お題の一覧。絞り込みの条件はURLに保つ。
export const Route = createFileRoute("/admin/topics/")({
  validateSearch: (search: Record<string, unknown>): TopicListSearch => {
    const status = pick(topicStatusSchema, search.status);
    const difficulty = pick(difficultySchema, search.difficulty);
    return { ...(status ? { status } : {}), ...(difficulty ? { difficulty } : {}) };
  },
  loader: ({ context }) => (context.admin.authenticated ? listAdminTopics() : null),
  head: () => ({ meta: [{ title: "お題 | 管理画面 | Animic" }] }),
  component: TopicList,
});

function TopicList() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  if (!data) return null;
  return (
    <TopicListScreen
      data={data}
      search={search}
      onSearchChange={(next) => void navigate({ to: "/admin/topics", search: next })}
      onOpen={(topicId) => void navigate({ to: "/admin/topics/$topicId", params: { topicId } })}
      onAdd={() => void navigate({ to: "/admin/topics/new" })}
    />
  );
}
