import * as v from "valibot";

import { accountIconSchema } from "../account/account-icon";
import {
  battleStateSchema,
  battleSettingsSchema,
  battleSnapshotSchema,
} from "../battle/battle-state";

// 読み間違えやすい0・O・1・I・Lを除く。
export const ROOM_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const roomCodeSchema = v.pipe(
  v.string(),
  v.toUpperCase(),
  v.regex(new RegExp(`^[${ROOM_CODE_CHARS}]{8}$`)),
);
/** ルームに参加できる人数。退出していない参加者（切断中を含む）を数える。 */
export const roomCapacity = 8;
/** 参加済みの人の再参加は人数に関係なく受け付け、新しい人は定員に達していない場合だけ受け付ける。 */
export function canJoinRoom(state: Pick<RoomState, "members">, participantId: string) {
  return (
    state.members.some((member) => member.id === participantId) ||
    state.members.length < roomCapacity
  );
}
export const participantNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(20));
const memberSchema = v.object({
  id: v.string(),
  name: participantNameSchema,
  ready: v.boolean(),
  // 作成・参加したときのアイコン。ログインしていない参加者や、選んでいない参加者はnull。
  icon: v.optional(v.nullable(accountIconSchema), null),
});
export const roomStateSchema = v.object({
  creation: v.optional(
    v.nullable(
      v.object({
        participantId: v.string(),
        requestId: v.pipe(v.string(), v.uuid()),
        name: participantNameSchema,
      }),
    ),
    null,
  ),
  code: roomCodeSchema,
  settings: v.optional(v.nullable(battleSettingsSchema), null),
  battle: v.optional(v.nullable(battleStateSchema), null),
  version: v.number(),
  hostId: v.nullable(v.string()),
  members: v.array(memberSchema),
  hostDisconnectedUntil: v.nullable(v.number()),
  closesAt: v.nullable(v.number()),
  closed: v.boolean(),
});
export type RoomState = v.InferOutput<typeof roomStateSchema>;
export const roomSnapshotSchema = v.object({
  code: roomCodeSchema,
  settings: v.optional(v.nullable(battleSettingsSchema), null),
  battle: v.optional(v.nullable(battleSnapshotSchema), null),
  version: v.number(),
  hostId: v.nullable(v.string()),
  members: v.array(v.object({ ...memberSchema.entries, connected: v.boolean() })),
  closed: v.boolean(),
});
export type RoomSnapshot = v.InferOutput<typeof roomSnapshotSchema>;

// 接続の増減とAlarmの両方で、保存された期限をサーバー時刻と照合する。
export function reconcileRoom(state: RoomState, connected: Set<string>, now: number): RoomState {
  const next = structuredClone(state);
  if (next.closed) return next;
  if (next.closesAt !== null && next.closesAt <= now) {
    next.closed = true;
    return next;
  }
  if (connected.size > 0) next.closesAt = null;
  else next.closesAt ??= now + 30 * 60_000;

  if (next.hostId && connected.has(next.hostId)) {
    next.hostDisconnectedUntil = null;
  } else {
    next.hostDisconnectedUntil ??= now + 30_000;
    if (!next.hostId || next.hostDisconnectedUntil <= now) {
      const successor = next.members.find((member) => connected.has(member.id));
      if (successor) {
        next.hostId = successor.id;
        next.hostDisconnectedUntil = null;
      }
    }
  }
  return next;
}

// 状態確認と予約の間に期限を跨いでも処理を取り落とさない。
export function getRoomDeadline(
  state: RoomState,
  connected: Set<string>,
  now: number,
): number | null {
  if (state.closed) return null;
  const deadlines: number[] = [];
  if (state.closesAt !== null) deadlines.push(Math.max(now, state.closesAt));
  if (
    state.hostDisconnectedUntil !== null &&
    !connected.has(state.hostId ?? "") &&
    state.members.some((member) => connected.has(member.id))
  )
    deadlines.push(Math.max(now, state.hostDisconnectedUntil));
  // 引き継ぎ先がない間は、過去のホスト期限で即時Alarmを繰り返さない。
  return deadlines.length ? Math.min(...deadlines) : null;
}
