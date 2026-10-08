import type { BattleSnapshot } from "./battle-state";

type BattleResult = NonNullable<BattleSnapshot["result"]>;

export type ResultHeadline = {
  title: "YOU WIN!" | "YOU LOSE…" | "DRAW" | "NO GAME";
  message: string;
};

/** 確定した結果を、見ている参加者から見た見出しと説明にする。 */
export function getResultHeadline(
  result: BattleResult,
  participantId: string,
  opponentName: string,
): ResultHeadline {
  if (result.kind === "win") {
    return result.winnerId === participantId
      ? { title: "YOU WIN!", message: `${opponentName} さんに勝ちました！` }
      : { title: "YOU LOSE…", message: `${opponentName} さんの勝ちです。次こそは！` };
  }
  if (result.kind === "draw") return { title: "DRAW", message: "最終スコアが同点でした" };
  return result.reason === "scoring-failed"
    ? { title: "NO GAME", message: "採点できなかったため、勝負不成立です" }
    : { title: "NO GAME", message: "どちらも提出しなかったため、勝負不成立です" };
}

export type ResultEntry = {
  participantId: string;
  winner: boolean;
  submitted: boolean;
  /** 公開されていない画像（スコアで決まる前の相手の提出画像）は`null`。 */
  imageUrl: string | null;
  total: number | null;
};

// 1対1では、採点まで進んだ結果は両者とも提出している。
function isSubmitted(result: BattleResult, participantId: string) {
  if (result.kind === "win" && result.reason === "opponent-not-submitted") {
    return result.winnerId === participantId;
  }
  return result.reason !== "no-submissions";
}

/** 参加者ごとの提出・提出画像・最終スコア・勝者を、見ている参加者を先頭にして返す。 */
export function getResultEntries(battle: BattleSnapshot, participantId: string): ResultEntry[] {
  const { result, mySubmission } = battle;
  if (!result) return [];
  const myImage = battle.myGenerations.find(
    (item) => mySubmission?.status === "submitted" && item.id === mySubmission.generationId,
  );
  const myImageUrl = myImage?.status === "succeeded" ? myImage.imageUrl : null;
  return battle.participantIds
    .toSorted((a, b) => Number(b === participantId) - Number(a === participantId))
    .map((id) => {
      const score = battle.scores?.find((item) => item.participantId === id);
      return {
        participantId: id,
        winner: result.kind === "win" && result.winnerId === id,
        submitted: isSubmitted(result, id),
        imageUrl: score?.imageUrl ?? (id === participantId ? myImageUrl : null),
        total: score?.total ?? null,
      };
    });
}
