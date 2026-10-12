import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { TopicNewScreen } from "../../../features/admin/topic-new-screen";

// お題の追加（画像を選んで非公開のお題を作る）。
export const Route = createFileRoute("/admin/topics/new")({
  head: () => ({ meta: [{ title: "お題を追加 | 管理画面 | Animic" }] }),
  component: TopicNew,
});

function TopicNew() {
  const { admin } = Route.useRouteContext();
  const navigate = useNavigate();
  if (!admin.authenticated) return null;
  return (
    <TopicNewScreen
      onOpen={(topicId) => void navigate({ to: "/admin/topics/$topicId", params: { topicId } })}
      onBack={() => void navigate({ to: "/admin/topics" })}
    />
  );
}
