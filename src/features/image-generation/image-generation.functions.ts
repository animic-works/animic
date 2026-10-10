import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { env, waitUntil } from "cloudflare:workers";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { generationTimeoutMs } from "../battle/battle-state";
import type { GenerationOutcome } from "../battle/battle-state";
import { roomCodeSchema } from "../room/room-state";
import { putGeneratedImage } from "./generated-images.server";
import { generationInputSchema, getInputHash } from "./generation-input";
import { getNovelAiQueue } from "./novelai.server";

/**
 * 対戦の画像を1枚生成する。結果は返さず、ルームの状態配信（`myGenerations`）で本人に届ける。
 * 同じ処理IDの再送ではNovelAIを呼ばない。受付を拒否したらエラーを投げる。
 */
export const generateImage = createServerFn({ method: "POST" })
  .validator(
    v.object({
      code: roomCodeSchema,
      battleId: v.pipe(v.string(), v.uuid()),
      generationId: v.pipe(v.string(), v.uuid()),
      ...generationInputSchema.entries,
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
    if (!current) throw new Error("参加するにはセッションの再作成が必要です。");
    const room = env.ROOMS.getByName(data.code);
    const { battleId, generationId, prompt } = data;
    const { accepted, acceptedAt } = await room.acceptGeneration(
      battleId,
      current.user.id,
      generationId,
      await getInputHash({ prompt }),
    );
    if (!accepted) return;
    const finished = (async () => {
      let outcome: GenerationOutcome = { status: "failed" };
      try {
        const result = await getNovelAiQueue().generate(prompt, acceptedAt + generationTimeoutMs);
        if (result.ok)
          outcome = {
            status: "succeeded",
            imageUrl: await putGeneratedImage({ battleId, generationId }, result.image),
          };
      } catch (error) {
        console.error("画像を生成・保存できませんでした。", { battleId, generationId, error });
      }
      await room.finishGeneration(battleId, generationId, outcome);
    })();
    // 参加者が通信を切っても、生成と完了の通知を続ける。
    waitUntil(finished);
    await finished;
  });
