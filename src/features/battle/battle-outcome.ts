import type { BattleSnapshot } from "./battle-state";

type BattleResult = NonNullable<BattleSnapshot["result"]>;

/**
 * 最終スコアの高い順の順位。同点は同じ順位。1人だけ提出した場合は、採点を待たずにその人を1位にする。
 * 未提出の人・採点できなかった人と、勝負不成立は`null`。
 */
export function getRank(
  participantId: string,
  result: BattleResult,
  scores: readonly { participantId: string; total: number }[] | null,
) {
  const score = scores?.find((item) => item.participantId === participantId);
  if (score) return 1 + (scores ?? []).filter((item) => item.total > score.total).length;
  return result.kind === "win" &&
    result.reason === "opponent-not-submitted" &&
    result.winnerId === participantId
    ? 1
    : null;
}

export type RankingEntry = {
  participantId: string;
  /** 採点で決まった順位。同点は同じ順位。未提出・採点できなかった人は`null`。 */
  rank: number | null;
  imageUrl: string | null;
  total: number | null;
};

/**
 * 対戦の順位を、最終スコアの高い順に返す。順位のない人は最後に並べる。
 * 1人だけ提出した場合は、採点を待たずにその人を1位にする。提出画像は、配信された人と自分の分だけを返す。
 */
export function getRanking(battle: BattleSnapshot, participantId: string): RankingEntry[] {
  const { result, mySubmission } = battle;
  if (!result) return [];
  const myImage = battle.myGenerations.find(
    (item) => mySubmission?.status === "submitted" && item.id === mySubmission.generationId,
  );
  return battle.participantIds
    .map((id) => {
      const score = battle.scores?.find((item) => item.participantId === id);
      return {
        participantId: id,
        rank: getRank(id, result, battle.scores),
        imageUrl:
          score?.imageUrl ??
          (id === participantId && myImage?.status === "succeeded" ? myImage.imageUrl : null),
        total: score?.total ?? null,
      };
    })
    .toSorted((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}

/** 順位を「1st」「2nd」のような表記にする。 */
export function ordinal(rank: number) {
  return rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`;
}
