import { DurableObject, env } from "cloudflare:workers";
import webpEncoderWasm from "@jsquash/webp/codec/enc/webp_enc_simd.wasm";
import * as v from "valibot";

import { toPlainWebp } from "./generated-image";
import { defaultImageModel, imageModelSchema } from "./image-models";
import type { ImageModel } from "./image-models";
import { minimumTimeMs, requestImage } from "./novelai";
import { readApiTokens, TokenPool } from "./novelai-tokens";

// 429は同じアカウントの別の生成が終わっていない状態。短い間隔で送り直すとロックが続くため、間を空ける。
const lockedRetryIntervalMs = 10_000;
const maxAttempts = 3;
const stylePromptSchema = v.optional(v.pipe(v.string(), v.trim()), "");
const modelKey = "model";

/** 全ルームの生成を1つのキューに並べるため、生成キューのDOは1つのインスタンスだけを使う。 */
export function getNovelAiQueue() {
  return env.NOVELAI_QUEUE.getByName("default");
}

// NovelAIは1アカウントで同時に1件しか生成できないため、全ルームの生成を受付順に並べ、
// `NOVELAI_API_TOKEN`にカンマ区切りで登録したトークンごとに1件ずつ送る。
export class NovelAiQueue extends DurableObject<Env> {
  #tokens: string[];
  #pool: TokenPool;

  constructor(ctx: DurableObjectState, bindings: Env) {
    super(ctx, bindings);
    this.#tokens = readApiTokens(bindings.NOVELAI_API_TOKEN);
    this.#pool = new TokenPool(this.#tokens.length);
  }

  /** 運営者が管理画面で選んだモデル。選んでいなければ既定のモデル。 */
  getModel(): ImageModel {
    const stored = v.safeParse(imageModelSchema, this.ctx.storage.kv.get(modelKey));
    return stored.success ? stored.output : defaultImageModel;
  }

  setModel(model: ImageModel) {
    this.ctx.storage.kv.put(modelKey, model);
  }

  /** 成功すると、メタデータと透過のないWebPを返す。 */
  async generate(prompt: string, deadline: number) {
    const result = await this.#run(prompt, deadline);
    // 変換はトークンを返した後に行い、次の生成のNovelAIとの通信と重ねる。
    return result.ok ? await this.#toWebp(result.image) : result;
  }

  // fetchの応答を待つ間もDOは次の要求を受け付けるため、トークンの貸し借りで順番と同時に送る数を守る。
  async #run(prompt: string, deadline: number) {
    const queuedAt = Date.now();
    const token = await this.#pool.acquire();
    if (token === null) {
      console.error("使えるNovelAIのトークンがありません。NOVELAI_API_TOKENを確かめてください。");
      return { ok: false, reason: "not-configured" } as const;
    }
    let usable = true;
    try {
      const result = await this.#request(token, prompt, deadline, queuedAt);
      // 401・402はトークンかアカウントの問題で、送り直しても同じ結果になる。
      if (!result.ok && (result.status === 401 || result.status === 402)) {
        usable = false;
        console.error("このNovelAIのトークンは、生成キューのDOが再起動するまで使いません。", {
          token: token + 1,
          status: result.status,
        });
      }
      return result;
    } finally {
      this.#pool.release(token, usable);
    }
  }

  async #toWebp(png: Uint8Array) {
    try {
      return { ok: true, image: await toPlainWebp(png, webpEncoderWasm) } as const;
    } catch (error) {
      console.error("生成した画像をWebPに変換できませんでした。", error);
      return { ok: false, reason: "invalid-response" } as const;
    }
  }

  /** `token`は`#tokens`の添字。ログにはトークンそのものではなく1始まりの番号を残す。 */
  async #request(token: number, prompt: string, deadline: number, queuedAt: number) {
    // 順番が来た時点のモデルを使う。管理画面で切り替えると、順番待ちの生成も新しいモデルになる。
    const model = this.getModel();
    console.info("NovelAIへ画像生成を送ります。", {
      model,
      token: token + 1,
      waitedMs: Date.now() - queuedAt,
      waiting: this.#pool.waiting,
    });
    const request = {
      apiUrl: this.env.NOVELAI_API_URL,
      token: this.#tokens[token] ?? "",
      prompt,
      stylePrompt: v.parse(stylePromptSchema, this.env.NOVELAI_STYLE_PROMPT),
      model,
      deadline,
    };
    let result = await requestImage(request);
    for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
      if (result.ok || result.status !== 429) break;
      if (deadline - Date.now() - lockedRetryIntervalMs < minimumTimeMs) break;
      console.info("NovelAIの生成がロック中のため、間を空けて送り直します。", {
        token: token + 1,
        attempt,
      });
      await new Promise((resolve) => setTimeout(resolve, lockedRetryIntervalMs));
      result = await requestImage(request);
    }
    if (result.ok) return result;
    // NovelAIのエラー文は呼び出し元へ返さず、ログにだけ残す。
    const { detail, ...failure } = result;
    console.error("NovelAIで画像を生成できませんでした。", {
      token: token + 1,
      ...failure,
      detail,
    });
    return failure;
  }
}
