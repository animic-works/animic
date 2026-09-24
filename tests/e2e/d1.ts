import { execFile } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { promisify } from "node:util";
import * as v from "valibot";

const execFileAsync = promisify(execFile);
const resultSchema = v.array(v.object({ results: v.array(v.record(v.string(), v.unknown())) }));

export async function executeLocalD1(sql: string) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const { stdout } = await execFileAsync("vp", [
        "exec",
        "wrangler",
        "d1",
        "execute",
        "DB",
        "--local",
        "--persist-to",
        ".wrangler/e2e",
        "--json",
        "--command",
        sql,
      ]);
      return v.parse(resultSchema, JSON.parse(stdout))[0]?.results ?? [];
    } catch (error) {
      // 別プロセスのWranglerとpreviewが同じローカルSQLiteを開く。
      if (attempt >= 5 || !(error instanceof Error && error.message.includes("SQLITE_BUSY")))
        throw error;
      await setTimeout(500);
    }
  }
}
