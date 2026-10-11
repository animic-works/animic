import { createFileRoute, useRouter } from "@tanstack/react-router";

import { PromptPhrasesScreen } from "../../features/admin/prompt-phrases-screen";
import { listPromptGroups } from "../../features/image-generation/prompt-phrases.functions";

// 対戦画面のプロンプト入力に使う「表現の辞書」。
export const Route = createFileRoute("/admin/prompts")({
  loader: ({ context }) => (context.admin.authenticated ? listPromptGroups() : null),
  head: () => ({ meta: [{ title: "表現の辞書 | 管理画面 | Animic" }] }),
  component: Prompts,
});

function Prompts() {
  const groups = Route.useLoaderData();
  const router = useRouter();
  if (!groups) return null;
  return <PromptPhrasesScreen groups={groups} onChanged={() => router.invalidate()} />;
}
