import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { getBattleRecords, savedBattleResultSchema } from "./battle-history";
import { battleRecord, battleResult } from "./battle.schema";

/** 確定した結果と参加者ごとの戦績を、同じバッチで保存する。保存済みの対戦IDは上書きしない。 */
export async function persistBattleResult(
  db: D1Database,
  battleId: string,
  roomCode: string,
  data: string,
) {
  const client = drizzle(db);
  const records = getBattleRecords(v.parse(savedBattleResultSchema, JSON.parse(data)));
  await client.batch([
    client
      .insert(battleResult)
      .values({ battleId, roomCode, data })
      .onConflictDoNothing({ target: battleResult.battleId }),
    client.insert(battleRecord).values(records).onConflictDoNothing(),
  ]);
}
