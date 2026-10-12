import { createFileRoute, notFound, useNavigate, useRouter } from "@tanstack/react-router";

import { TopicDetailScreen } from "../../../features/admin/topic-detail-screen";
import { getAdminTopic } from "../../../features/battle/topic-admin.functions";

// お題の編集・公開の切り替え・画像の差し替え・削除。
export const Route = createFileRoute("/admin/topics/$topicId")({
  loader: async ({ context, params }) => {
    if (!context.admin.authenticated) return null;
    const topic = await getAdminTopic({ data: { id: params.topicId } });
    if (!topic) throw notFound();
    return topic;
  },
  head: () => ({ meta: [{ title: "お題 | 管理画面 | Animic" }] }),
  component: TopicDetail,
});

function TopicDetail() {
  const topic = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  if (!topic) return null;
  return (
    <TopicDetailScreen
      // 読み直したら入力を保存済みの内容に戻す。
      key={`${topic.id}:${topic.updatedAt}`}
      topic={topic}
      onBack={() => void navigate({ to: "/admin/topics" })}
      onChanged={() => router.invalidate()}
      onDeleted={() => void navigate({ to: "/admin/topics" })}
    />
  );
}
