import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { generationTimeoutMs } from "../battle/battle-state";
import { roomCodeSchema } from "../room/room-state";
import { checkGenerationInput, generationInputEntries, getInputHash } from "./generation-input";
import { getNovelAiQueue } from "./novelai.server";

/**
 * 対戦の画像を1枚生成する。結果は返さず、ルームの状態配信（`myGenerations`）で本人に届ける。
 * 同じ処理IDの再送ではNovelAIを呼ばない。受付を拒否したか、生成キューのDOへ依頼できなかったらエラーを投げる。
 */
export const generateImage = createServerFn({ method: "POST" })
  .validator(
    v.pipe(
      v.object({
        code: roomCodeSchema,
        battleId: v.pipe(v.string(), v.uuid()),
        generationId: v.pipe(v.string(), v.uuid()),
        ...generationInputEntries,
      }),
      checkGenerationInput(),
    ),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
    if (!current) throw new Error("参加するにはセッションの再作成が必要です。");
    const room = env.ROOMS.getByName(data.code);
    const { battleId, generationId, prompt, characters } = data;
    const { accepted, acceptedAt, characterCount } = await room.acceptGeneration(
      battleId,
      current.user.id,
      generationId,
      await getInputHash({ prompt, characters }),
      characters.length,
    );
    if (!accepted) return;
    // キャラクターの数はお題に合わせる。送られなかったキャラの欄は空のまま送る。
    const input = {
      prompt,
      characters: Array.from({ length: characterCount }, (_, index) => characters[index] ?? ""),
    };
    // R2への保存とルームのDOへの完了の通知までは生成キューのDOが行い、参加者が通信を切っても続ける。
    const requested = await getNovelAiQueue()
      .generate(
        { code: data.code, battleId, generationId },
        input,
        acceptedAt + generationTimeoutMs,
      )
      .then(
        () => true,
        (error: unknown) => {
          console.error("生成キューのDOへ生成を依頼できませんでした。", {
            battleId,
            generationId,
            error,
          });
          return false;
        },
      );
    if (requested) return;
    // 依頼できなかった生成は、受付から1分のタイムアウトまで生成中のまま残り、次の生成も塞ぐ。
    // 失敗として確定する。生成キューのDOが先に完了を通知していれば、ルームのDOはこの失敗を無視する。
    await room.finishGeneration(battleId, generationId, { status: "failed" });
    throw new Error("画像を生成できませんでした。もう一度お試しください。");
  });
