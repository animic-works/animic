import * as v from "valibot";

import { getRank } from "./battle-outcome";
import {
  battleResultSchema,
  battleSettingsSchema,
  submissionSchema,
  topicSchema,
} from "./battle-state";

/** D1の`battle_result.data`。`serializeBattleResult`が書き出す形。 */
export const savedBattleResultSchema = v.object({
  battleId: v.string(),
  roomCode: v.string(),
  // 表示名は後から加えたため、それより前に保存した結果にはない。
  names: v.optional(v.record(v.string(), v.string()), {}),
  topic: topicSchema,
  settings: battleSettingsSchema,
  participantIds: v.array(v.string()),
  submissions: v.array(submissionSchema),
  result: battleResultSchema,
  scores: v.nullable(v.array(v.object({ participantId: v.string(), total: v.number() }))),
  startedAt: v.number(),
  submittedImages: v.array(
    v.object({ id: v.string(), participantId: v.string(), imageUrl: v.nullable(v.string()) }),
  ),
});
export type SavedBattleResult = v.InferOutput<typeof savedBattleResultSchema>;

/** 参加者ごとの戦績の行（D1の`battle_record`）。 */
export type BattleRecord = {
  battleId: string;
  participantId: string;
  startedAt: number;
  difficulty: SavedBattleResult["settings"]["difficulty"];
  participantCount: number;
  rank: number | null;
  total: number | null;
  imageUrl: string | null;
};

function submittedImageUrl(saved: SavedBattleResult, participantId: string) {
  return (
    saved.submittedImages.find((image) => image.participantId === participantId)?.imageUrl ?? null
  );
}

/** 保存する結果から、参加者ごとの戦績の行を作る。順位とスコアは結果画面と同じ規則で求める。 */
export function getBattleRecords(saved: SavedBattleResult): BattleRecord[] {
  return saved.participantIds.map((participantId) => ({
    battleId: saved.battleId,
    participantId,
    startedAt: saved.startedAt,
    difficulty: saved.settings.difficulty,
    participantCount: saved.participantIds.length,
    rank: getRank(participantId, saved.result, saved.scores),
    total: saved.scores?.find((score) => score.participantId === participantId)?.total ?? null,
    imageUrl: submittedImageUrl(saved, participantId),
  }));
}

export type BattleHistoryStats = {
  matches: number;
  /** 1位になった回数。同点の1位を含む。 */
  wins: number;
  /** 1位になった回数の割合（%）。対戦がなければ0。 */
  winRate: number;
  bestTotal: number | null;
  /** 採点された対戦の再現度の平均。 */
  averageTotal: number | null;
};

/** マイページに出す成績。対戦数には未提出や勝負不成立の対戦も数える。 */
export function getBattleHistoryStats(
  records: readonly Pick<BattleRecord, "rank" | "total">[],
): BattleHistoryStats {
  const wins = records.filter((record) => record.rank === 1).length;
  const totals = records.flatMap((record) => (record.total === null ? [] : [record.total]));
  return {
    matches: records.length,
    wins,
    winRate: records.length ? Math.round((wins / records.length) * 100) : 0,
    bestTotal: totals.length ? Math.max(...totals) : null,
    averageTotal: totals.length
      ? totals.reduce((sum, total) => sum + total, 0) / totals.length
      : null,
  };
}

/**
 * 1つの対戦を、参加した本人から見た詳細にする。
 * ほかの参加者の提出画像は、結果画面と同じく採点で順位が決まった人の分だけ含める。
 * 参加者IDは画面へ渡さない。
 */
export function getBattleDetail(saved: SavedBattleResult, participantId: string) {
  const submission = saved.submissions.find((item) => item.participantId === participantId);
  const myScore = saved.scores?.find((score) => score.participantId === participantId);
  const ranking = saved.participantIds
    .map((id, index) => ({
      key: index,
      name: saved.names[id] ?? null,
      isMe: id === participantId,
      rank: getRank(id, saved.result, saved.scores),
      total: saved.scores?.find((score) => score.participantId === id)?.total ?? null,
      submitted: saved.submissions.some(
        (item) => item.participantId === id && item.status === "submitted",
      ),
      imageUrl:
        id === participantId || saved.scores?.some((score) => score.participantId === id)
          ? submittedImageUrl(saved, id)
          : null,
    }))
    .toSorted((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  return {
    battleId: saved.battleId,
    roomCode: saved.roomCode,
    startedAt: saved.startedAt,
    topicImageUrl: saved.topic.imageUrl,
    settings: saved.settings,
    participantCount: saved.participantIds.length,
    resultKind: saved.result.kind,
    rank: getRank(participantId, saved.result, saved.scores),
    total: myScore?.total ?? null,
    imageUrl: submittedImageUrl(saved, participantId),
    submission:
      submission?.status === "submitted"
        ? {
            seconds: Math.max(0, Math.round((submission.submittedAt - saved.startedAt) / 1000)),
            withinTimeLimit: submission.eligibleForSpeedBonus,
            generationCount: submission.successfulGenerationCount,
          }
        : null,
    ranking,
  };
}
