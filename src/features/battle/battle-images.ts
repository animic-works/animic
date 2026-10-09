import type { BattleSnapshot } from "./battle-state";

type Generation = BattleSnapshot["myGenerations"][number];
export type SucceededGeneration = Extract<Generation, { status: "succeeded" }>;
/** 履歴から選んだ画像。選んだ後に新しい画像が届いたら、最新の画像を候補に戻す。 */
export type BattleImagePick = { id: string; after: number };

/** 本人の生成履歴を受付順に並べ、提出候補と番号を求める。 */
export function getBattleImages(
  generations: readonly Generation[],
  pick: BattleImagePick | null,
  submittedId: string | null,
) {
  const ordered = generations.toSorted((a, b) => a.acceptedAt - b.acceptedAt);
  const succeeded = ordered.filter(
    (item): item is SucceededGeneration => item.status === "succeeded",
  );
  const pendings = ordered.filter((item) => item.status === "pending");
  const newest = succeeded.at(-1) ?? null;
  const selected =
    !pick || succeeded.length > pick.after
      ? newest
      : (succeeded.find((item) => item.id === pick.id) ?? newest);
  return {
    ordered,
    succeeded,
    pendings,
    selected,
    submitted: succeeded.find((item) => item.id === submittedId),
    /** 受付順の1始まりの番号。 */
    numberOf: (id: string) => ordered.findIndex((item) => item.id === id) + 1,
  };
}
