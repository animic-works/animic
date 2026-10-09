import { useBrowserState, writeBrowserState } from "../browser-store";
import { participant } from "../room/room-preview-store";
import * as v from "valibot";
import { artFeatures, type ArtKey } from "../image-generation/art-features";
import type { BattleResult } from "./battle-presentation";

const number = v.pipe(v.number(), v.finite());
function feature(key: ArtKey) {
  return v.pipe(
    v.string(),
    v.check((value) => artFeatures[key].some((option) => option.id === value)),
  );
}
export const generatedImageSchema = v.object({
  id: number,
  status: v.picklist(["pending", "ready", "failed"]),
  features: v.object({
    hair: feature("hair"),
    style: feature("style"),
    eyes: feature("eyes"),
    outfit: feature("outfit"),
    face: feature("face"),
    bg: feature("bg"),
  }),
  prompt: v.string(),
  similarity: number,
  createdAt: number,
  completesAt: number,
});
const schema = v.object({
  completed: v.boolean(),
  result: v.object({
    id: v.string(),
    code: v.string(),
    rules: v.object({
      level: v.picklist(["easy", "normal", "hard"]),
      duration: v.picklist([60, 90, 120]),
      limit: v.picklist([0, 3, 5, 10]),
    }),
    players: v.pipe(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          isMe: v.boolean(),
          entry: v.nullable(
            v.object({ image: generatedImageSchema, remaining: number, generations: number }),
          ),
        }),
      ),
      v.minLength(1),
      v.maxLength(8),
      v.check((players) => players.filter((player) => player.isMe).length === 1),
    ),
  }),
});
const key = (id: string) => `animic-experience-result:${participant()?.id ?? ""}:${id}`;
export function keepBattleResult(result: BattleResult, completed = false) {
  writeBrowserState(key(result.id), { result, completed });
}
export function useStoredResult(id: string) {
  return useBrowserState(key(id), schema);
}
