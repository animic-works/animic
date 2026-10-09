import * as v from "valibot";
const number = v.pipe(v.number(), v.finite());
const optionalNumber = v.optional(v.nullable(number), null);
export const historyEntrySchema = v.object({
  key: v.string(),
  at: number,
  level: v.string(),
  players: number,
  rank: v.nullable(number),
  total: v.nullable(number),
  sim: optionalNumber,
  speed: optionalNumber,
  bonus: optionalNumber,
  gens: optionalNumber,
  code: v.optional(v.string(), ""),
  art: v.optional(v.nullable(v.string()), null),
  topic: v.optional(v.string()),
  prompt: v.optional(v.string(), ""),
  cats: v.optional(
    v.nullable(v.object({ char: number, tag: number, content: number, pose: number })),
    null,
  ),
  ranking: v.optional(
    v.array(
      v.object({
        name: v.string(),
        rank: v.nullable(number),
        total: v.nullable(number),
        art: v.nullable(v.string()),
        isMe: v.boolean(),
      }),
    ),
    [],
  ),
});
export type HistoryEntry = v.InferOutput<typeof historyEntrySchema>;
export function parseHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const result = v.safeParse(historyEntrySchema, entry);
    return result.success ? [result.output] : [];
  });
}
