import { DurableObject } from "cloudflare:workers";
import * as v from "valibot";

import { minimumTimeMs, requestImage } from "./novelai";

const apiUrl = "https://image.novelai.net";
// 429は同じアカウントの別の生成が終わっていない状態。短い間隔で送り直すとロックが続くため、間を空ける。
const lockedRetryIntervalMs = 10_000;
const maxAttempts = 3;
const configSchema = v.object({ NOVELAI_API_TOKEN: v.pipe(v.string(), v.minLength(1)) });

// NovelAIは1アカウントで同時に1件しか生成できないため、全ルームの生成を受付順に1件ずつ送る。
export class NovelAiQueue extends DurableObject<Env> {
  #tail: Promise<unknown> = Promise.resolve();
  #waiting = 0;

  generate(prompt: string, deadline: number) {
    const queuedAt = Date.now();
    this.#waiting += 1;
    // fetchの応答を待つ間もDOは次の要求を受け付けるため、Promiseをつないで順番を守る。
    const run = this.#tail.then(() => {
      this.#waiting -= 1;
      return this.#request(prompt, deadline, queuedAt);
    });
    this.#tail = run.catch(() => {});
    return run;
  }

  async #request(prompt: string, deadline: number, queuedAt: number) {
    const config = v.safeParse(configSchema, this.env);
    if (!config.success) {
      console.error("NOVELAI_API_TOKENを設定してください。");
      return { ok: false, reason: "not-configured" } as const;
    }
    console.info("NovelAIへ画像生成を送ります。", {
      waitedMs: Date.now() - queuedAt,
      waiting: this.#waiting,
    });
    const request = { apiUrl, token: config.output.NOVELAI_API_TOKEN, prompt, deadline };
    let result = await requestImage(request);
    for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
      if (result.ok || result.status !== 429) break;
      if (deadline - Date.now() - lockedRetryIntervalMs < minimumTimeMs) break;
      console.info("NovelAIの生成がロック中のため、間を空けて送り直します。", { attempt });
      await new Promise((resolve) => setTimeout(resolve, lockedRetryIntervalMs));
      result = await requestImage(request);
    }
    if (result.ok) return result;
    // NovelAIのエラー文は呼び出し元へ返さず、ログにだけ残す。
    const { detail, ...failure } = result;
    console.error("NovelAIで画像を生成できませんでした。", { ...failure, detail });
    return failure;
  }
}
