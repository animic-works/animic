import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

import { createAuth } from "../../lib/auth.server";
import { roomCodeSchema } from "../room/room-state";
import { placeholderImageUrl } from "./placeholder-art.server";

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// 生成を受け付け、完了を反映する。同じ要求IDの再送は新しい生成として扱わない。
// 画像生成サービスをつなぐまでは、受付の1.5秒後にプロンプトから決めた仮の挿絵で完了にする
export const requestGeneration = createServerFn({ method: "POST" })
  .validator(
    v.object({
      code: roomCodeSchema,
      battleId: v.pipe(v.string(), v.uuid()),
      requestId: v.pipe(v.string(), v.uuid()),
      prompt: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)),
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const current = await createAuth().api.getSession({ headers: getRequestHeaders() });
    if (!current) throw new Error("参加するにはセッションの再作成が必要です。");
    const room = env.ROOMS.getByName(data.code);
    const accepted = await room.acceptGeneration(
      data.battleId,
      current.user.id,
      data.requestId,
      await sha256(data.prompt),
    );
    if (!accepted) return { accepted: false };
    const imageUrl = placeholderImageUrl(data.prompt, data.requestId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await room.finishGeneration(data.battleId, data.requestId, { status: "succeeded", imageUrl });
    return { accepted: true };
  });
