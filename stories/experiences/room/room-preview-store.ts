import * as v from "valibot";
import { readBrowserState, writeBrowserState, useBrowserState } from "../browser-store";
import type { RoomRules } from "./room-presentation";
const previewRulesSchema = v.object({
  level: v.picklist(["easy", "normal", "hard"]),
  duration: v.picklist([60, 90, 120]),
  limit: v.picklist([0, 3, 5, 10]),
});
const memberSchema = v.object({ id: v.string(), name: v.string(), ready: v.boolean() });
const participantSchema = v.object({ id: v.string(), name: v.string() });
const roomSchema = v.object({
  code: v.string(),
  hostId: v.string(),
  createdAt: v.number(),
  members: v.array(memberSchema),
  rules: previewRulesSchema,
  countdownAt: v.nullable(v.number()),
  battle: v.nullable(
    v.object({
      id: v.string(),
      startedAt: v.number(),
      rules: previewRulesSchema,
      members: v.array(memberSchema),
      finished: v.boolean(),
    }),
  ),
});
export type PreviewRoom = v.InferOutput<typeof roomSchema>;
const participantKey = "animic-experience-participant";
const roomKey = (code: string) => `animic-experience-room:${code}`;
export function participant() {
  return readBrowserState(participantKey, participantSchema);
}
function identifyParticipant(name: string) {
  const value = { id: participant()?.id ?? crypto.randomUUID(), name };
  writeBrowserState(participantKey, value);
  return value;
}
function readPreviewRoom(code: string) {
  return readBrowserState(roomKey(code), roomSchema);
}
export function usePreviewRoom(code: string) {
  return useBrowserState(roomKey(code), roomSchema);
}
export function useParticipant() {
  return useBrowserState(participantKey, participantSchema);
}
export function createPreviewRoom(name: string) {
  const me = identifyParticipant(name),
    alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code: string;
  do {
    code = Array.from(
      crypto.getRandomValues(new Uint8Array(8)),
      (n) => alphabet[n % alphabet.length],
    ).join("");
  } while (readPreviewRoom(code));
  const room: PreviewRoom = {
    code,
    hostId: me.id,
    createdAt: Date.now(),
    members: [{ ...me, ready: true }],
    rules: { level: "easy", duration: 90, limit: 5 },
    countdownAt: null,
    battle: null,
  };
  writeBrowserState(roomKey(code), room);
  return room;
}
export function joinPreviewRoom(code: string, name: string) {
  const room = readPreviewRoom(code);
  if (
    !room ||
    (room.members.length >= 8 && !room.members.some((member) => member.id === participant()?.id))
  )
    return null;
  const me = identifyParticipant(name);
  const members = room.members.some((member) => member.id === me.id)
    ? room.members.map((member) => (member.id === me.id ? { ...member, name } : member))
    : [...room.members, { ...me, ready: false }];
  const next = { ...room, members };
  writeBrowserState(roomKey(code), next);
  return next;
}
function update(code: string, reduce: (room: PreviewRoom, id: string) => PreviewRoom) {
  const room = readPreviewRoom(code),
    me = participant();
  if (!room || !me || !room.members.some((m) => m.id === me.id)) return;
  const next = reduce(room, me.id);
  if (next !== room) writeBrowserState(roomKey(code), next);
}
export function setPreviewRules(code: string, rules: RoomRules) {
  update(code, (room, id) =>
    room.hostId === id && room.countdownAt === null && !room.battle ? { ...room, rules } : room,
  );
}
export function togglePreviewReady(code: string) {
  update(code, (room, id) =>
    room.countdownAt === null && !room.battle
      ? { ...room, members: room.members.map((m) => (m.id === id ? { ...m, ready: !m.ready } : m)) }
      : room,
  );
}
export function startPreviewBattle(code: string, now = Date.now()) {
  update(code, (room, id) =>
    room.hostId === id && room.members.length >= 2 && room.countdownAt === null && !room.battle
      ? { ...room, countdownAt: now }
      : room,
  );
}
// Simulated arrivals belong to this local adapter, not the presentation components.
export function advancePreviewRoom(code: string, now = Date.now()) {
  update(code, (room) => {
    if (room.battle) return room;
    if (room.countdownAt !== null)
      return now < room.countdownAt + 3400
        ? room
        : {
            ...room,
            countdownAt: null,
            battle: {
              id: crypto.randomUUID(),
              startedAt: room.countdownAt + 3400,
              rules: room.rules,
              members: room.members,
              finished: false,
            },
          };
    const members = [...room.members];
    for (const [i, name] of ["ぴよ丸", "ぴくせる侍", "プロンプト職人"].entries()) {
      const id = `visitor-${i}`,
        arrival = room.createdAt + 2500 + i * 2200;
      if (now < arrival) continue;
      const ready = now >= arrival + 1800 + i * 900,
        index = members.findIndex((m) => m.id === id);
      if (index < 0 && members.length < 8) members.push({ id, name, ready });
      else if (index >= 0 && ready && !members[index].ready)
        members[index] = { ...members[index], ready };
    }
    return members.length === room.members.length && members.every((m, i) => m === room.members[i])
      ? room
      : { ...room, members };
  });
}
export function finishPreviewBattle(code: string) {
  update(code, (room) =>
    room.battle ? { ...room, battle: { ...room.battle, finished: true } } : room,
  );
}
export function rematchPreviewRoom(code: string) {
  update(code, (room, id) =>
    room.hostId === id && room.battle?.finished
      ? {
          ...room,
          battle: null,
          countdownAt: null,
          members: room.members.map((m) => ({ ...m, ready: m.id === room.hostId })),
        }
      : room,
  );
}
export function leavePreviewRoom(code: string) {
  update(code, (room, id) => {
    const members = room.members.filter((m) => m.id !== id);
    return { ...room, members, hostId: room.hostId === id ? (members[0]?.id ?? "") : room.hostId };
  });
}
