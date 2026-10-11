import { createFileRoute, useRouter } from "@tanstack/react-router";

import { ScoringWeightsScreen } from "../../../features/admin/scoring-weights-screen";
import { getScoringWeights } from "../../../features/scoring/scoring-weights.functions";

// 再現度の指標ごとの重みと、最終スコアのボーナス。
export const Route = createFileRoute("/admin/scoring/weights")({
  loader: ({ context }) => (context.admin.authenticated ? getScoringWeights() : null),
  head: () => ({ meta: [{ title: "採点の重み | 管理画面 | Animic" }] }),
  component: ScoringWeights,
});

function ScoringWeights() {
  const data = Route.useLoaderData();
  const router = useRouter();
  if (!data) return null;
  return (
    <ScoringWeightsScreen
      key={JSON.stringify(data)}
      weights={data.weights}
      bonus={data.bonus}
      savedAt={data.savedAt}
      onSaved={() => router.invalidate()}
    />
  );
}
