import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import { requireAdmin } from "../../lib/admin.server";
import { battleOptionsSchema } from "./battle-options";
import { loadBattleOptions, replaceBattleOptions } from "./battle-options.server";

/** ロビーで選べる対戦条件の候補。参加前の人にも見せてよい情報のため認証しない。 */
export const getBattleOptions = createServerFn({ method: "GET" }).handler(() =>
  loadBattleOptions(env.DB),
);

export const saveBattleOptions = createServerFn({ method: "POST" })
  .validator(battleOptionsSchema)
  .handler(async ({ data }) => {
    requireAdmin();
    await replaceBattleOptions(env.DB, data);
  });
