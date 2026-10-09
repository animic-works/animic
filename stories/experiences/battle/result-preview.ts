import { artRandom, decodeArt, encodeArt } from "../image-generation/art-preview";
import { levels } from "../../../src/features/room/room-presentation";
import type { LobbyModel } from "../room/room-presentation";
import type { HistoryEntry } from "../account/history-entry";
import type { BattleResult, SubmittedImage } from "./battle-presentation";
function previewScore(entry: SubmittedImage | null, duration: number) {
  if (!entry) return null;
  const speed = Math.round((Math.max(0, entry.remaining) / duration) * 20);
  const bonus = Math.max(0, 15 - (Math.max(1, entry.generations) - 1) * 3);
  return {
    sim: entry.image.similarity,
    speed,
    bonus,
    total: Math.round((entry.image.similarity + speed + bonus) * 10) / 10,
  };
}
export function rankResults(result: BattleResult) {
  const players = result.players
    .map((player, seat) => ({
      ...player,
      seat,
      score: previewScore(player.entry, result.rules.duration),
      metrics: player.entry
        ? previewMetrics(player.entry.image.similarity, `${result.id}-${player.id}`)
        : null,
      rank: 0,
    }))
    .toSorted((a, b) => (b.score?.total ?? -1) - (a.score?.total ?? -1));
  return players.map((player) => ({
    ...player,
    rank:
      1 +
      players.filter((other) => (other.score?.total ?? -1) > (player.score?.total ?? -1)).length,
  }));
}
function previewMetrics(sim: number, seed: string) {
  const random = artRandom(seed);
  const values = [
    sim + (random() - 0.5) * 12,
    sim + (random() - 0.5) * 12,
    sim + (random() - 0.5) * 12,
    sim + (random() - 0.5) * 12,
  ];
  const shift = sim - values.reduce((a, b) => a + b) / 4;
  const clamp = (value: number) => Math.round(Math.max(2, Math.min(99.5, value + shift)) * 10) / 10;
  return {
    char: clamp(values[0]),
    tag: clamp(values[1]),
    content: clamp(values[2]),
    pose: clamp(values[3]),
  };
}
export function resultHistory(result: BattleResult, at: number): HistoryEntry {
  const ranked = rankResults(result),
    me = ranked.find((player) => player.isMe)!;
  const key = result.id;
  return {
    key,
    at,
    code: result.code,
    level: levels[result.rules.level].label,
    players: ranked.length,
    rank: me.score ? me.rank : null,
    total: me.score?.total ?? null,
    sim: me.score?.sim ?? null,
    speed: me.score?.speed ?? null,
    bonus: me.score?.bonus ?? null,
    gens: me.entry?.generations ?? null,
    art: me.entry ? encodeArt(me.entry.image.features) : null,
    prompt: me.entry?.image.prompt ?? "",
    topic: levels[result.rules.level].image,
    cats: me.metrics,
    ranking: ranked.map((player) => ({
      name: player.name,
      rank: player.score ? player.rank : null,
      total: player.score?.total ?? null,
      art: player.entry ? encodeArt(player.entry.image.features) : null,
      isMe: player.isMe,
    })),
  };
}
export function initialResult(room: LobbyModel): BattleResult {
  const codes = [
    "pink.twin.blue.sailor.smile.white",
    "pink.bob.blue.sailor.smile.sky",
    "blonde.twin.red.hoodie.wink.white",
  ];
  return {
    id: `sample-${room.code}`,
    code: room.code,
    rules: room.rules,
    players: room.players.map((player, i) => ({
      ...player,
      entry:
        i < 3
          ? {
              image: {
                id: i + 1,
                status: "ready",
                features: decodeArt(codes[i]),
                prompt: "",
                similarity: [88.4, 79.2, 71.6][i],
                createdAt: 0,
                completesAt: 0,
              },
              remaining: [41, 22, 30][i],
              generations: [3, 5, 2][i],
            }
          : null,
    })),
  };
}
