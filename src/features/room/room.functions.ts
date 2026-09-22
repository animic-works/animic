import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

import { createRoomCode } from "./room-creation";
import { battleSettingsSchema } from "../battle/battle-state";
import { createAuth } from "../../lib/auth.server";
import { participantNameSchema, roomCodeSchema, roomSnapshotSchema } from "./room-state";

async function identity() {
  setResponseHeader("Cache-Control", "private, no-store");
  return createAuth().api.getSession({ headers: getRequestHeaders() });
}

async function requireParticipant() {
  const current = await identity();
  if (!current) throw new Error("参加するにはセッションの再作成が必要です。");
  return current.user.id;
}

export const createRoom = createServerFn({ method: "POST" })
  .validator(v.object({ name: participantNameSchema, requestId: v.pipe(v.string(), v.uuid()) }))
  .handler(async ({ data }) => {
    const participantId = await requireParticipant();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = await createRoomCode(participantId, data.requestId, attempt);
      if (
        await env.ROOMS.getByName(code).create(code, {
          participantId,
          requestId: data.requestId,
          name: data.name,
        })
      )
        return code;
    }
    throw new Error("ルームを作成できませんでした。もう一度お試しください。");
  });

export const getRoomEntry = createServerFn({ method: "GET" })
  .validator(v.object({ code: roomCodeSchema }))
  .handler(async ({ data }) => {
    using result = await env.ROOMS.getByName(data.code).entry((await identity())?.user.id ?? null);
    return {
      exists: result.exists,
      room: result.room ? v.parse(roomSnapshotSchema, result.room) : null,
      inviteUrl: new URL(`/rooms/${data.code}`, env.BETTER_AUTH_URL).href,
    };
  });

export const joinRoom = createServerFn({ method: "POST" })
  .validator(v.object({ code: roomCodeSchema, name: participantNameSchema }))
  .handler(async ({ data }) =>
    env.ROOMS.getByName(data.code).join(await requireParticipant(), data.name),
  );

export const setReady = createServerFn({ method: "POST" })
  .validator(v.object({ code: roomCodeSchema, ready: v.boolean() }))
  .handler(async ({ data }) =>
    env.ROOMS.getByName(data.code).setReady(await requireParticipant(), data.ready),
  );

export const leaveRoom = createServerFn({ method: "POST" })
  .validator(v.object({ code: roomCodeSchema }))
  .handler(async ({ data }) => env.ROOMS.getByName(data.code).leave(await requireParticipant()));

export const setRoomSettings = createServerFn({ method: "POST" })
  .validator(
    v.object({
      code: roomCodeSchema,
      settings: battleSettingsSchema,
      previousBattleId: v.nullable(v.pipe(v.string(), v.uuid())),
    }),
  )
  .handler(async ({ data }) =>
    env.ROOMS.getByName(data.code).setSettings(
      await requireParticipant(),
      data.settings,
      data.previousBattleId,
    ),
  );
