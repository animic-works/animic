import * as v from "valibot";

import { accountIconSchema } from "../account/account-icon";
import {
  abandonBattle,
  applyScoringJobs,
  battleStateSchema,
  battleSettingsSchema,
  battleSnapshotSchema,
  canStartAfter,
  reconcileBattle,
} from "../battle/battle-state";
import type { ScoringJobOutcome } from "../battle/battle-state";

// 読み間違えやすい0・O・1・I・Lを除く。
export const ROOM_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const roomCodeSchema = v.pipe(
  v.string(),
  v.toUpperCase(),
  v.regex(new RegExp(`^[${ROOM_CODE_CHARS}]{8}$`)),
);
/** 全員の接続が切れてから、ルームを閉じるまでの時間。 */
export const roomCloseDelayMs = 3 * 60_000;
/** ルームに参加できる人数。退出していない参加者（切断中を含む）を数える。 */
export const roomCapacity = 8;
/** 参加済みの人の再参加は人数に関係なく受け付け、新しい人は定員に達していない場合だけ受け付ける。 */
export function canJoinRoom(state: Pick<RoomState, "members">, participantId: string) {
  return (
    state.members.some((member) => member.id === participantId) ||
    state.members.length < roomCapacity
  );
}
/** 1つのルームで行える対戦の数。 */
export const roomBattleLimit = 2;
/** 始めた対戦の数（`battleCount`）から、このルームでまだ対戦を始められるか。 */
export function hasBattlesLeft(battleCount: number) {
  return battleCount < roomBattleLimit;
}
export const battleLimitError = `このルームで遊べる対戦は${roomBattleLimit}回までです。`;
/** 対戦の結果が出た後、操作のない接続を切るまでの時間。 */
export const idleConnectionMs = 5 * 60_000;
/**
 * 操作のない接続を切る時刻。対戦の結果が出た後だけ数え、結果が決まった時刻と、
 * その接続の最後の操作（なければ接続した時刻）の遅い方から数える。
 */
export function getIdleDeadline(battle: RoomState["battle"], lastActiveAt: number) {
  const decidedAt = battle?.result?.decidedAt;
  return decidedAt === undefined ? null : Math.max(decidedAt, lastActiveAt) + idleConnectionMs;
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
  // このルームで始めた対戦の数。この値を保存する前に作ったルームは0から数える。
  battleCount: v.optional(v.number(), 0),
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
  battleCount: v.number(),
  version: v.number(),
  hostId: v.nullable(v.string()),
  members: v.array(v.object({ ...memberSchema.entries, connected: v.boolean() })),
  closed: v.boolean(),
});
export type RoomSnapshot = v.InferOutput<typeof roomSnapshotSchema>;

// 接続の増減とAlarmの両方で、保存された期限をサーバー時刻と照合する。
export function reconcileRoom(state: RoomState, connected: Set<string>, now: number): RoomState {
  const next = structuredClone(state);
  if (!next.closed && next.closesAt !== null && next.closesAt <= now) next.closed = true;
  if (next.closed) {
    // 閉じたルームでは対戦を進めないため、結果の出ていない対戦は閉じた時刻で勝負不成立にする。
    if (next.battle) next.battle = abandonBattle(next.battle, next.closesAt ?? now);
    return next;
  }
  if (connected.size > 0) next.closesAt = null;
  else next.closesAt ??= now + roomCloseDelayMs;

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

/**
 * ホストが次の対戦の条件を変更できない理由。変更できれば`null`。
 * 対戦の数が上限に達したルームでは、開始と同じく受け付けない。
 */
export function getSettingsError(
  state: RoomState,
  participantId: string,
  previousBattleId: string | null,
) {
  if (
    state.closed ||
    !canStartAfter(state.battle, previousBattleId) ||
    state.hostId !== participantId
  )
    return "ホストのみ条件を変更できます。";
  return hasBattlesLeft(state.battleCount) ? null : battleLimitError;
}

/**
 * 参加者が準備状態を変更できない理由。変更できれば`null`。
 * 対戦の数が上限に達したルームでは、開始と同じく受け付けない。
 */
export function getReadyError(state: RoomState, participantId: string) {
  if (state.closed || !state.members.some((member) => member.id === participantId))
    return "ルームへの参加が必要です。";
  if (state.battle && !state.battle.result) return "対戦中は準備状態を変更できません。";
  return hasBattlesLeft(state.battleCount) ? null : battleLimitError;
}

/**
 * 採点ジョブの結果を反映したルームの状態。採点ジョブを確かめる間にルームを閉じる時刻や採点期限を
 * 過ぎた場合に、遅れて届いた採点で勝敗を決めないよう、同じ時刻で期限を反映してから採点を反映する。
 * 閉じたルームや、別の対戦・結果の確定した対戦には反映せず`null`を返す。
 */
export function applyRoomScoring(
  state: RoomState,
  connected: Set<string>,
  battleId: string,
  jobs: ScoringJobOutcome[],
  now: number,
): RoomState | null {
  const next = reconcileRoom(state, connected, now);
  if (next.closed || !next.battle || next.battle.id !== battleId) return null;
  const battle = reconcileBattle(next.battle, now);
  if (battle.result) return null;
  next.battle = applyScoringJobs(battle, jobs, now);
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
