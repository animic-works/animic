import { createFileRoute, useRouter } from "@tanstack/react-router";

import { PromptPhrasesScreen } from "../../features/admin/prompt-phrases-screen";
import { listPromptGroups } from "../../features/image-generation/prompt-phrases.functions";

// プロンプト入力の「よく使う表現」。
export const Route = createFileRoute("/admin/prompts")({
  loader: ({ context }) => (context.admin.authenticated ? listPromptGroups() : null),
  head: () => ({ meta: [{ title: "よく使う表現 | 管理画面 | Animic" }] }),
  component: Prompts,
});

function Prompts() {
  const groups = Route.useLoaderData();
  const router = useRouter();
  if (!groups) return null;
  return <PromptPhrasesScreen groups={groups} onChanged={() => router.invalidate()} />;
}
