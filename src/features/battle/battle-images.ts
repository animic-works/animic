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

/**
 * 比較の見出しに出す案内。選んでいる画像は比較の枠で見えるため、提出済み・時間切れのときと、
 * 選べる画像があるのに選んでいないときだけ出す。選べる画像がまだなければ出さない（`null`）。
 */
export function getImagesNotice(images: ReturnType<typeof getBattleImages>, noImage: boolean) {
  const { submitted, selected, succeeded, numberOf } = images;
  if (submitted) return `#${numberOf(submitted.id)} を提出しました`;
  if (noImage) return "時間切れのため提出できません";
  if (!selected && succeeded.length > 0) return "画像を1枚選んでください";
  return null;
}
