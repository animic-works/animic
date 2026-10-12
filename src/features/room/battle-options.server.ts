import { drizzle } from "drizzle-orm/d1";

import { readBattleOptions, toBattleOptionRows } from "./battle-options";
import type { BattleOptions } from "./battle-options";
import { battleOption } from "./battle-options.schema";

export async function loadBattleOptions(db: D1Database) {
  return readBattleOptions(await drizzle(db).select().from(battleOption));
}

/** 候補を置き換える書き込み。D1の`batch`で1つのトランザクションとして実行する。 */
export function replaceBattleOptions(db: D1Database, options: BattleOptions) {
  const client = drizzle(db);
  const rows = toBattleOptionRows(options);
  return client.batch([
    client.delete(battleOption),
    ...rows.map((row) => client.insert(battleOption).values(row)),
  ]);
}
