import { createFileRoute } from "@tanstack/react-router";
import { MyPage } from "../../features/account/mypage-page";
import { getMyBattleHistory } from "../../features/battle/battle-history.functions";
import { parseLoginSearch } from "../../features/room/entry-login";
import { getCurrentParticipant } from "../../lib/auth.functions";
export const Route = createFileRoute("/mypage/")({
  validateSearch: parseLoginSearch,
  loader: async () => {
    const [participant, history] = await Promise.all([
      getCurrentParticipant(),
      getMyBattleHistory(),
    ]);
    return { account: participant?.account ?? null, history };
  },
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: () => ({ meta: [{ title: "マイページ | Animic" }] }),
  component: function MyPageRoute() {
    const { account, history } = Route.useLoaderData();
    const { error } = Route.useSearch();
    return <MyPage account={account} history={history} loginError={error} />;
  },
});
