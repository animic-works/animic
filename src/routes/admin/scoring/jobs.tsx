import { createFileRoute, useRouter } from "@tanstack/react-router";

import { ScoringJobsScreen } from "../../../features/admin/scoring-jobs-screen";
import { getScoringAdminData } from "../../../features/scoring/scoring-admin.functions";

// 採点ジョブの一覧（新しい順）。
export const Route = createFileRoute("/admin/scoring/jobs")({
  loader: ({ context }) => (context.admin.authenticated ? getScoringAdminData() : null),
  head: () => ({ meta: [{ title: "採点ジョブ | 管理画面 | Animic" }] }),
  component: ScoringJobs,
});

function ScoringJobs() {
  const data = Route.useLoaderData();
  const router = useRouter();
  if (!data) return null;
  return <ScoringJobsScreen jobs={data.jobs} onRefresh={() => router.invalidate()} />;
}
