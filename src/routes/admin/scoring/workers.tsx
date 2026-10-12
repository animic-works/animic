import { createFileRoute, useRouter } from "@tanstack/react-router";

import { ScoringWorkersScreen } from "../../../features/admin/scoring-workers-screen";
import { getScoringAdminData } from "../../../features/scoring/scoring-admin.functions";

// リンクコードの発行と、採点ワーカーの一覧・失効。
export const Route = createFileRoute("/admin/scoring/workers")({
  loader: ({ context }) => (context.admin.authenticated ? getScoringAdminData() : null),
  head: () => ({ meta: [{ title: "採点ワーカー | 管理画面 | Animic" }] }),
  component: ScoringWorkers,
});

function ScoringWorkers() {
  const data = Route.useLoaderData();
  const router = useRouter();
  if (!data) return null;
  return <ScoringWorkersScreen workers={data.workers} onChanged={() => router.invalidate()} />;
}
