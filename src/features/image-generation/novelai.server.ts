import { DurableObject, env } from "cloudflare:workers";
import * as v from "valibot";

import { defaultImageModel, imageModelSchema } from "./image-models";
import type { ImageModel } from "./image-models";
import { minimumTimeMs, requestImage } from "./novelai";

const apiUrl = "https://image.novelai.net";
// 429は同じアカウントの別の生成が終わっていない状態。短い間隔で送り直すとロックが続くため、間を空ける。
const lockedRetryIntervalMs = 10_000;
const maxAttempts = 3;
const configSchema = v.object({
  NOVELAI_API_TOKEN: v.pipe(v.string(), v.minLength(1)),
  NOVELAI_STYLE_PROMPT: v.optional(v.pipe(v.string(), v.trim()), ""),
});
const modelKey = "model";

/** 全ルームの生成を1つのキューに並べるため、生成キューのDOは1つのインスタンスだけを使う。 */
export function getNovelAiQueue() {
  return env.NOVELAI_QUEUE.getByName("default");
}

// NovelAIは1アカウントで同時に1件しか生成できないため、全ルームの生成を受付順に1件ずつ送る。
export class NovelAiQueue extends DurableObject<Env> {
  #tail: Promise<unknown> = Promise.resolve();
  #waiting = 0;

  /** 運営者が管理画面で選んだモデル。選んでいなければ既定のモデル。 */
  getModel(): ImageModel {
    const stored = v.safeParse(imageModelSchema, this.ctx.storage.kv.get(modelKey));
    return stored.success ? stored.output : defaultImageModel;
  }

  setModel(model: ImageModel) {
    this.ctx.storage.kv.put(modelKey, model);
  }

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
    // 順番が来た時点のモデルを使う。管理画面で切り替えると、順番待ちの生成も新しいモデルになる。
    const model = this.getModel();
    console.info("NovelAIへ画像生成を送ります。", {
      model,
      waitedMs: Date.now() - queuedAt,
      waiting: this.#waiting,
    });
    const request = {
      apiUrl,
      token: config.output.NOVELAI_API_TOKEN,
      prompt,
      stylePrompt: config.output.NOVELAI_STYLE_PROMPT,
      model,
      deadline,
    };
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
