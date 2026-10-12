import { DurableObject } from "cloudflare:workers";
import { and, gt, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import {
  startNextBattle,
  canStartAfter,
  canStartBattle,
  reconcileBattle,
  acceptGeneration,
  characterCount,
  finishGeneration,
  submitImage,
  getBattleSnapshot,
  getScoredParticipantIds,
  serializeBattleResult,
  getScoringRequests,
  applyScoringJobs,
  getBattleDeadline,
} from "../battle/battle-state";
import type { BattleSettings, Topic, GenerationOutcome } from "../battle/battle-state";
import { persistBattleResult } from "../battle/battle-results.server";
import {
  cancelScoringJobs,
  getScoringJobs,
  registerScoringJobs,
} from "../scoring/scoring-jobs.server";
import { loadScoringWeights } from "../scoring/scoring-weights.server";
import type { AccountIcon } from "../account/account-icon";
import { isRoomCreationRetry } from "./room-creation";
import type { RoomCreation } from "./room-creation";
import { session } from "../../lib/auth-schema";
import {
  canJoinRoom,
  reconcileRoom,
  getRoomDeadline,
  roomCapacity,
  roomCloseDelayMs,
  roomStateSchema,
} from "./room-state";
import type { RoomSnapshot, RoomState } from "./room-state";

const attachmentSchema = v.object({
  participantId: v.string(),
  sessionId: v.string(),
  expiresAt: v.number(),
  connectedAt: v.optional(v.number()),
});
const scoringCheckIntervalMs = 3000;
// 画面は15秒ごとにpingを送る。隠れたタブではブラウザーがタイマーを1分ごとにまとめることがあるため、
// 余裕を見て、これより長くpingのない接続を切れたものとして扱う。
const staleSocketMs = 90_000;
// 対戦結果のD1への保存を試す回数。間隔を30秒から倍に延ばし（1時間まで）、約3時間で再試行をやめる。
const resultMaxAttempts = 10;

function resultRetryDelayMs(attempts: number) {
  return Math.min(30_000 * 2 ** (attempts - 1), 60 * 60_000);
}

export class Room extends DurableObject<Env> {
  // 操作のたびに予約し直しても、採点の確認を先へ延ばし続けない。
  #scoringCheckAt: number | null = null;

  constructor(ctx: DurableObjectState, bindings: Env) {
    super(ctx, bindings);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS result_delivery (battle_id TEXT PRIMARY KEY, data TEXT NOT NULL, retry_at INTEGER NOT NULL, saved INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0)",
    );
    // 試した回数の列を加える前に作った表にも足す。
    if (
      !ctx.storage.sql
        .exec("SELECT * FROM result_delivery LIMIT 0")
        .columnNames.includes("attempts")
    )
      ctx.storage.sql.exec(
        "ALTER TABLE result_delivery ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0",
      );
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  #read() {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM room WHERE id = 1")
      .toArray()[0];
    return row ? v.parse(roomStateSchema, JSON.parse(row.data)) : null;
  }

  #save(state: RoomState) {
    state.version += 1;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        "INSERT INTO room (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
        JSON.stringify(state),
      );
      const battle = state.battle;
      if (battle?.result) {
        const data = serializeBattleResult(
          battle,
          state.code,
          new Map(state.members.map((member) => [member.id, member.name])),
        );
        this.ctx.storage.sql.exec(
          "INSERT OR IGNORE INTO result_delivery (battle_id, data, retry_at) VALUES (?, ?, ?)",
          battle.id,
          data,
          Date.now(),
        );
      }
    });
  }

  #sockets() {
    return this.ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN);
  }

  #connected() {
    return new Set(
      this.#sockets().map(
        (socket) => v.parse(attachmentSchema, socket.deserializeAttachment()).participantId,
      ),
    );
  }

  #reconcile() {
    const previous = this.#read();
    if (!previous) return null;
    const next = reconcileRoom(previous, this.#connected(), Date.now());
    if (next.battle) next.battle = reconcileBattle(next.battle, Date.now());
    if (JSON.stringify(previous) !== JSON.stringify(next)) this.#save(next);
    return next;
  }

  #snapshot(state: RoomState, participantId: string | null): RoomSnapshot {
    const connected = this.#connected();
    return {
      code: state.code,
      battle: state.battle ? getBattleSnapshot(state.battle, participantId, Date.now()) : null,
      settings: state.settings,
      version: state.version,
      hostId: state.hostId,
      closed: state.closed,
      members: state.members.map((member) => ({ ...member, connected: connected.has(member.id) })),
    };
  }

  async #schedule() {
    const state = this.#read();
    const pending = this.ctx.storage.sql
      .exec<{ retry_at: number }>(
        "SELECT retry_at FROM result_delivery WHERE saved = 0 AND attempts < ? ORDER BY retry_at LIMIT 1",
        resultMaxAttempts,
      )
      .toArray()[0];
    if (!state || state.closed) {
      if (pending) await this.ctx.storage.setAlarm(Math.max(Date.now(), pending.retry_at));
      else await this.ctx.storage.deleteAlarm();
      return;
    }
    const now = Date.now();
    const roomDeadline = getRoomDeadline(state, this.#connected(), now);
    const deadlines: number[] = roomDeadline === null ? [] : [roomDeadline];
    if (pending) deadlines.push(Math.max(now, pending.retry_at));
    const battle = state.battle;
    if (battle) {
      const battleDeadline = getBattleDeadline(battle, now);
      if (battleDeadline !== null) deadlines.push(battleDeadline);
      if (getScoringRequests(battle).length) {
        this.#scoringCheckAt ??= now + scoringCheckIntervalMs;
        deadlines.push(Math.max(now, this.#scoringCheckAt));
      }
    }
    if (this.#sockets().length) {
      deadlines.push(now + 30_000);
      for (const socket of this.#sockets()) {
        const expiry = v.parse(attachmentSchema, socket.deserializeAttachment()).expiresAt;
        if (expiry > now) deadlines.push(expiry);
      }
    }
    if (deadlines.length) await this.ctx.storage.setAlarm(Math.min(...deadlines));
    else await this.ctx.storage.deleteAlarm();
  }

  async #persistResults() {
    const pending = this.ctx.storage.sql
      .exec<{ battle_id: string; data: string; attempts: number }>(
        "SELECT battle_id, data, attempts FROM result_delivery WHERE saved = 0 AND attempts < ? AND retry_at <= ?",
        resultMaxAttempts,
        Date.now(),
      )
      .toArray();
    for (const item of pending) {
      const attempts = item.attempts + 1;
      // D1への通信中に停止しても、保存済みの予定から再試行する。
      this.ctx.storage.sql.exec(
        "UPDATE result_delivery SET attempts = ?, retry_at = ? WHERE battle_id = ?",
        attempts,
        Date.now() + resultRetryDelayMs(attempts),
        item.battle_id,
      );
      await this.#schedule();
      try {
        const room = this.#read();
        if (!room) throw new Error("ルームがありません。");
        // 結果が決まった対戦の採点ジョブは使わないため、保存より先に取り消す。
        await cancelScoringJobs(this.env.DB, item.battle_id);
        await persistBattleResult(this.env.DB, item.battle_id, room.code, item.data);
        this.ctx.storage.sql.exec(
          "UPDATE result_delivery SET saved = 1 WHERE battle_id = ?",
          item.battle_id,
        );
      } catch (error) {
        console.error(
          attempts < resultMaxAttempts
            ? "対戦結果を保存できませんでした。再試行します。"
            : "対戦結果を保存できませんでした。再試行をやめます。",
          { battleId: item.battle_id, attempts, error },
        );
      }
    }
  }

  // 採点ジョブの登録と結果の取得は冪等にし、失敗しても次のAlarmでやり直す。
  async #syncScoring() {
    this.#scoringCheckAt = null;
    const state = this.#read();
    const battle = state?.battle;
    const requests = battle ? getScoringRequests(battle) : [];
    if (!state || state.closed || !battle || !requests.length) return;
    try {
      await registerScoringJobs(this.env.DB, battle.id, state.code, battle.startedAt, requests);
      const jobs = await getScoringJobs(
        this.env.DB,
        requests.map((request) => request.jobId),
      );
      // D1との通信中に対戦が進んだ場合も、現在の対戦の状態から反映する。
      const current = this.#read();
      // 結果の確定後に登録が届いた場合も、そのジョブを割り当てない。
      if (!current?.battle || current.battle.id !== battle.id || current.battle.result) {
        await cancelScoringJobs(this.env.DB, battle.id);
        return;
      }
      current.battle = applyScoringJobs(current.battle, jobs, Date.now());
      this.#save(current);
    } catch {
      console.error("採点ジョブを確認できませんでした。再試行します。", { battleId: battle.id });
    }
  }

  // 通信が途絶えてCloseが届かない接続を残すと、ルームが閉じずAlarmが続く。
  #closeStaleSockets() {
    const now = Date.now();
    for (const socket of this.#sockets()) {
      const lastSeen =
        this.ctx.getWebSocketAutoResponseTimestamp(socket)?.getTime() ??
        v.parse(attachmentSchema, socket.deserializeAttachment()).connectedAt;
      if (lastSeen !== undefined && now - lastSeen > staleSocketMs)
        socket.close(4408, "接続を確認できませんでした");
    }
  }

  async #publish() {
    this.#closeStaleSockets();
    this.#reconcile();
    await this.#schedule();
    await this.#persistResults();
    const sockets = this.#sockets();
    const sessionIds = [
      ...new Set(
        sockets.map(
          (socket) => v.parse(attachmentSchema, socket.deserializeAttachment()).sessionId,
        ),
      ),
    ];
    if (sessionIds.length) {
      try {
        const valid = await drizzle(this.env.DB)
          .select({ id: session.id, userId: session.userId, expiresAt: session.expiresAt })
          .from(session)
          .where(and(inArray(session.id, sessionIds), gt(session.expiresAt, new Date())));
        for (const socket of sockets) {
          const identity = v.parse(attachmentSchema, socket.deserializeAttachment());
          const current = valid.find(
            (item) => item.id === identity.sessionId && item.userId === identity.participantId,
          );
          if (!current || current.expiresAt.getTime() <= Date.now())
            socket.close(4401, "セッションが失効しました");
          else socket.serializeAttachment({ ...identity, expiresAt: current.expiresAt.getTime() });
        }
      } catch (error) {
        // 保存済みの操作を失敗として返さない。セッションは次の配信（30秒以内のAlarm）で確かめる。
        console.error("接続のセッションを確認できませんでした。", { error });
      }
    }
    const state = this.#reconcile();
    if (state) {
      this.#save(state);
      for (const socket of this.#sockets()) {
        if (state.closed) socket.close(4404, "ルームは終了しました");
        else {
          const { participantId } = v.parse(attachmentSchema, socket.deserializeAttachment());
          socket.send(JSON.stringify(this.#snapshot(state, participantId)));
        }
      }
    }
    await this.#schedule();
  }

  async create(code: string, creation: RoomCreation, icon: AccountIcon | null) {
    const previous = this.#reconcile();
    if (previous) {
      if (!isRoomCreationRetry(previous.creation, creation)) return false;
      if (previous.closed) throw new Error("この作成要求のルームは終了しています。");
      await this.#schedule();
      return true;
    }
    const { participantId, name } = creation;
    this.#save({
      creation,
      code,
      version: 0,
      battle: null,
      settings: null,
      hostId: participantId,
      members: [{ id: participantId, name, ready: false, icon }],
      hostDisconnectedUntil: null,
      closesAt: Date.now() + roomCloseDelayMs,
      closed: false,
    });
    await this.#schedule();
    return true;
  }

  async entry(participantId: string | null) {
    const state = this.#reconcile();
    await this.#schedule();
    if (!state || state.closed) return { exists: false, room: null };
    return {
      exists: true,
      room: state.members.some((member) => member.id === participantId)
        ? this.#snapshot(state, participantId)
        : null,
    };
  }

  async join(participantId: string, name: string, icon: AccountIcon | null) {
    const state = this.#reconcile();
    if (!state || state.closed) throw new Error("ルームが見つからないか、終了しています。");
    if (!canJoinRoom(state, participantId))
      throw new Error(`このルームは満員です（${roomCapacity}人まで）。`);
    if (!state.members.some((member) => member.id === participantId)) {
      state.members.push({ id: participantId, name, ready: false, icon });
      this.#save(state);
    }
    await this.#publish();
  }

  async setSettings(
    participantId: string,
    settings: BattleSettings,
    previousBattleId: string | null,
  ) {
    const state = this.#reconcile();
    if (
      !state ||
      state.closed ||
      !canStartAfter(state.battle, previousBattleId) ||
      state.hostId !== participantId
    )
      throw new Error("ホストのみ条件を変更できます。");
    state.settings = settings;
    this.#save(state);
    await this.#publish();
    return state.version;
  }

  canStart(participantId: string, previousBattleId: string | null) {
    const state = this.#reconcile();
    const connected = this.#connected();
    return Boolean(
      state &&
      !state.closed &&
      canStartAfter(state.battle, previousBattleId) &&
      state.hostId === participantId &&
      connected.has(participantId) &&
      canStartBattle(state.members.filter((member) => connected.has(member.id)).length),
    );
  }

  async startBattle(
    participantId: string,
    settings: BattleSettings,
    topic: Topic,
    previousBattleId: string | null,
  ) {
    // 最終スコアのボーナスは、対戦を始めた時刻に使う値を記録する。再現度の重みも同じ時刻で引く。
    // D1を待つ間にほかの操作が進むため、状態は読み込んだ後に確かめる。
    const now = Date.now();
    const { bonus } = await loadScoringWeights(this.env.DB, new Date(now));
    const state = this.#reconcile();
    if (!state || state.closed || state.hostId !== participantId)
      throw new Error("ホストのみ開始できます。");
    if (state.battle && state.battle.previousBattleId === previousBattleId) return;
    if (JSON.stringify(state.settings) !== JSON.stringify(settings))
      throw new Error("対戦の条件が変更されています。");
    const connected = this.#connected();
    if (!connected.has(participantId)) throw new Error("ルームへ再接続してから開始してください。");
    state.battle = startNextBattle(
      state.battle,
      previousBattleId,
      settings,
      topic,
      state.members.filter((member) => connected.has(member.id)).map((member) => member.id),
      now,
      bonus,
    );
    for (const member of state.members) member.ready = false;
    this.#save(state);
    await this.#publish();
  }

  #requireBattle(battleId: string) {
    const state = this.#reconcile();
    if (!state || state.closed || !state.battle || state.battle.id !== battleId)
      throw new Error("対象の対戦が見つかりません。");
    return { state, battle: state.battle };
  }

  async acceptGeneration(
    battleId: string,
    participantId: string,
    id: string,
    inputHash: string,
    characters = 0,
  ) {
    const { state, battle } = this.#requireBattle(battleId);
    if (!state.members.some((member) => member.id === participantId))
      throw new Error("ルームへの参加が必要です。");
    const result = acceptGeneration(
      battle,
      { participantId, id, inputHash, characters },
      Date.now(),
    );
    state.battle = result.battle;
    this.#save(state);
    await this.#publish();
    // 生成の期限は、呼び出し側の時計ではなくこのDOが記録した受付時刻から数える。
    return {
      accepted: result.accepted,
      acceptedAt: result.acceptedAt,
      characterCount: characterCount(battle.settings.difficulty),
    };
  }

  async finishGeneration(battleId: string, id: string, outcome: GenerationOutcome) {
    const state = this.#reconcile();
    // 前の対戦の完了通知で、現在の対戦を更新しない。
    if (!state || state.closed || !state.battle || state.battle.id !== battleId) return;
    state.battle = finishGeneration(state.battle, id, outcome, Date.now());
    this.#save(state);
    await this.#publish();
  }

  async submitImage(battleId: string, participantId: string, generationId: string) {
    const { state, battle } = this.#requireBattle(battleId);
    if (!state.members.some((member) => member.id === participantId))
      throw new Error("ルームへの参加が必要です。");
    state.battle = submitImage(battle, participantId, generationId, Date.now());
    this.#save(state);
    await this.#publish();
  }

  /**
   * 結果画面で、参加者のスコアの内訳と指標を見せてよいか。最終スコアと同じく、
   * 採点で結果が決まった今の対戦について、ルームの参加者にだけ見せる。
   */
  canViewScore(battleId: string, viewerId: string, participantId: string) {
    const state = this.#reconcile();
    return Boolean(
      state &&
      !state.closed &&
      state.battle?.id === battleId &&
      state.members.some((member) => member.id === viewerId) &&
      getScoredParticipantIds(state.battle).includes(participantId),
    );
  }

  async setReady(participantId: string, ready: boolean) {
    const state = this.#reconcile();
    const member = state?.members.find((item) => item.id === participantId);
    if (!state || state.closed || !member) throw new Error("ルームへの参加が必要です。");
    if (state.battle && !state.battle.result) throw new Error("対戦中は準備状態を変更できません。");
    member.ready = ready;
    this.#save(state);
    await this.#publish();
  }

  async leave(participantId: string) {
    const state = this.#reconcile();
    if (!state || state.closed) return;
    state.members = state.members.filter((member) => member.id !== participantId);
    if (state.hostId === participantId) {
      state.hostId = null;
      state.hostDisconnectedUntil = null;
    }
    this.#save(state);
    for (const socket of this.#sockets()) {
      if (v.parse(attachmentSchema, socket.deserializeAttachment()).participantId === participantId)
        socket.close(4403, "ルームから退出しました");
    }
    await this.#publish();
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
      return new Response(null, { status: 426 });
    const identity = v.safeParse(attachmentSchema, {
      participantId: request.headers.get("X-Animic-Participant"),
      sessionId: request.headers.get("X-Animic-Session"),
      expiresAt: Number(request.headers.get("X-Animic-Expires")),
    });
    if (!identity.success || identity.output.expiresAt <= Date.now())
      return new Response(null, { status: 401 });
    const state = this.#reconcile();
    if (!state || state.closed) return new Response(null, { status: 404 });
    if (!state.members.some((member) => member.id === identity.output.participantId))
      return new Response(null, { status: 403 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ ...identity.output, connectedAt: Date.now() });
    this.#save(state);
    await this.#publish();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketClose() {
    await this.#publish();
  }
  async webSocketError(socket: WebSocket) {
    socket.close(1011, "接続を終了します");
    await this.#publish();
  }
  async webSocketMessage(socket: WebSocket) {
    socket.close(1008, "操作はHTTP経由で行ってください");
    await this.#publish();
  }
  async alarm() {
    await this.#syncScoring();
    await this.#publish();
  }
}
