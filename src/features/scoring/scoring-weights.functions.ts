import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import { scoreBonusSchema } from "./final-score";
import { scoringWeightsSchema } from "./scoring-metrics";
import { loadScoringWeights, saveScoringWeights } from "./scoring-weights.server";

/** 今の再現度の指標の重みとボーナス、それを保存した日時（既定値なら`null`）。 */
export const getScoringWeights = createServerFn({ method: "GET" }).handler(() => {
  requireAdmin();
  return loadScoringWeights(env.DB);
});

/** 重みとボーナスを保存する。保存した後に始まる対戦から使う。 */
export const updateScoringWeights = createServerFn({ method: "POST" })
  .validator(v.object({ weights: scoringWeightsSchema, bonus: scoreBonusSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    await saveScoringWeights(env.DB, data);
  });
