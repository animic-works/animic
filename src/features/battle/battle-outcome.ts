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
 * 3人以上の対戦の順位を、最終スコアの高い順に返す。順位のない人は最後に並べる。
 * 1人だけ提出した場合は、採点を待たずにその人を1位にする。
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

/** 結果をSNSで共有するときに載せるURL。個別の結果の公開ページはないため、トップページにする。 */
const shareUrl = "https://animic.party/";

/**
 * 結果をSNSで共有するときの文。外へ送るのは本人の順位・勝敗と最終スコアだけにし、
 * ほかの参加者の名前・点や画像は含めない。
 */
export function getShareText(battle: BattleSnapshot, participantId: string) {
  const { result } = battle;
  const total = battle.scores?.find((item) => item.participantId === participantId)?.total;
  const score = total === undefined ? "" : `（${total.toFixed(1)}pt）`;
  const count = battle.participantIds.length;
  const rank = result ? getRank(participantId, result, battle.scores) : null;
  const outcome =
    !result || result.kind === "no-contest" || rank === null
      ? `${count}人で対戦しました`
      : count > 2
        ? `${count}人中${rank}位になりました！`
        : result.kind === "draw"
          ? "引き分けでした！"
          : result.winnerId === participantId
            ? "勝ちました！"
            : "対戦しました";
  return `Animicのイラスト再現バトルで${outcome}${score} #Animic`;
}

/** Xの投稿画面を開くURL。 */
export function getShareIntentUrl(text: string) {
  const query = new URLSearchParams({ text, url: shareUrl });
  return `https://x.com/intent/post?${query.toString()}`;
}

/** 結果画面のヘッダーに出す、本人の結果の短い表示。3人以上は順位、2人は勝ち負け。結果のない人は「—」。 */
export function getPlacement(battle: BattleSnapshot, participantId: string) {
  const { result } = battle;
  const rank = result ? getRank(participantId, result, battle.scores) : null;
  if (!result || result.kind === "no-contest" || rank === null) return "—";
  if (battle.participantIds.length > 2) return ordinal(rank);
  if (result.kind === "draw") return "DRAW";
  return result.winnerId === participantId ? "WIN" : "LOSE";
}
