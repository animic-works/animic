import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

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
  .validator(v.object({ name: participantNameSchema }))
  .handler(async ({ data }) => {
    const participantId = await requireParticipant();
    const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    for (let attempt = 0; attempt < 8; attempt += 1) {
      let code = "";
      while (code.length < 8) {
        for (const value of crypto.getRandomValues(new Uint8Array(16))) {
          if (value < 248 && code.length < 8) code += alphabet[value % alphabet.length];
        }
      }
      if (await env.ROOMS.getByName(code).create(code, participantId, data.name)) return code;
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
