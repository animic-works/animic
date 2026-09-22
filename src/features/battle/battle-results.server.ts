import { drizzle } from "drizzle-orm/d1";
import { battleResult } from "./battle.schema";

export async function persistBattleResult(
  db: D1Database,
  battleId: string,
  roomCode: string,
  data: string,
) {
  await drizzle(db)
    .insert(battleResult)
    .values({ battleId, roomCode, data })
    .onConflictDoNothing({ target: battleResult.battleId });
}
