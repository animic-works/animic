import { createFileRoute, notFound } from "@tanstack/react-router";
import * as v from "valibot";
import { shareMeta } from "../../../features/home/share-meta";
import { getOgImage } from "../../../features/home/home-content.functions";
import { getMyBattleDetail } from "../../../features/battle/battle-history.functions";
import { MatchDetailPage } from "../../../features/battle/match-detail-page";
import { parseLoginSearch } from "../../../features/room/entry-login";
import { getCurrentParticipant } from "../../../lib/auth.functions";
export const Route = createFileRoute("/mypage/matches/$battleId")({
  validateSearch: parseLoginSearch,
  loader: async ({ params }) => {
    const battleId = v.safeParse(v.pipe(v.string(), v.uuid()), params.battleId);
    if (!battleId.success) throw notFound();
    const [participant, sharing, detail] = await Promise.all([
      getCurrentParticipant(),
      getOgImage(),
      getMyBattleDetail({ data: { battleId: battleId.output } }),
    ]);
    // ほかの人の対戦は、あるかどうかを知らせずに見つからないとする。
    if (participant?.account && !detail) throw notFound();
    return { detail, ...sharing };
  },
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: ({ loaderData }) => ({
    meta: [
      { title: "戦績の詳細 | Animic" },
      ...(loaderData ? shareMeta({ image: loaderData.ogImage }) : []),
    ],
  }),
  component: function MatchDetailRoute() {
    const { battleId } = Route.useParams();
    const { detail } = Route.useLoaderData();
    const { error } = Route.useSearch();
    return (
      <MatchDetailPage
        detail={detail}
        returnTo={`/mypage/matches/${battleId}`}
        loginError={error}
      />
    );
  },
});
