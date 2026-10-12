import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { getBattleHistory, getBattleHistoryDetail } from "./battle-history.server";

// 戦績はログインした本人だけが見られる。匿名で参加した対戦は戦績に含めない。
async function currentAccountId() {
  setResponseHeader("Cache-Control", "private, no-store");
  const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
  return current && !current.user.isAnonymous ? current.user.id : null;
}

/** ログインした参加者の成績と戦績。ログインしていなければ`null`。 */
export const getMyBattleHistory = createServerFn({ method: "GET" }).handler(async () => {
  const participantId = await currentAccountId();
  return participantId ? getBattleHistory(env.DB, participantId) : null;
});

/** ログインした参加者が参加した対戦の詳細。ログインしていないか、参加していない対戦なら`null`。 */
export const getMyBattleDetail = createServerFn({ method: "GET" })
  .validator(v.object({ battleId: v.pipe(v.string(), v.uuid()) }))
  .handler(async ({ data }) => {
    const participantId = await currentAccountId();
    return participantId ? getBattleHistoryDetail(env.DB, participantId, data.battleId) : null;
  });
