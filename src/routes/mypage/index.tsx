import { createFileRoute } from "@tanstack/react-router";
import { shareMeta } from "../../features/home/share-meta";
import { getOgImage } from "../../features/home/home-content.functions";
import { MyPage } from "../../features/account/mypage-page";
import { getMyBattleHistory } from "../../features/battle/battle-history.functions";
import { parseLoginSearch } from "../../features/room/entry-login";
import { getCurrentParticipant } from "../../lib/auth.functions";
export const Route = createFileRoute("/mypage/")({
  validateSearch: parseLoginSearch,
  loader: async () => {
    const [participant, history, sharing] = await Promise.all([
      getCurrentParticipant(),
      getMyBattleHistory(),
      getOgImage(),
    ]);
    return { account: participant?.account ?? null, history, ...sharing };
  },
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: ({ loaderData }) => ({
    meta: [
      { title: "マイページ | Animic" },
      ...(loaderData ? shareMeta({ image: loaderData.ogImage }) : []),
    ],
  }),
  component: function MyPageRoute() {
    const { account, history } = Route.useLoaderData();
    const { error } = Route.useSearch();
    return <MyPage account={account} history={history} loginError={error} />;
  },
});
