import { scoringMetrics } from "../scoring/scoring-metrics";
import type { BattleSnapshot } from "./battle-state";

/** 発表の対象。提出して採点できた人（配信の`scores`にいる人）。 */
export type RevealEntry = NonNullable<BattleSnapshot["scores"]>[number];

/**
 * 結果発表の時間。1人分の枠を、名前の呼び出し・採点の様子・点数の3段階に分ける。
 * 採点の様子は指標の数で等分し、指標を1つずつ「採点中→済み」にする。
 */
export const revealTiming = {
  introMs: 1_200,
  judgingMs: 4_000,
  scoreMs: 2_800,
} as const;
export type RevealTiming = { introMs: number; judgingMs: number; scoreMs: number };

const metricCount = scoringMetrics.length;
const slotMs = (timing: RevealTiming) => timing.introMs + timing.judgingMs + timing.scoreMs;

/**
 * 発表の対象を提出時刻の早い順に並べる。同時刻（猶予の期限の自動の提出など）は参加順。
 * 結果が未確定か、`scores`がない結果（勝負不成立・1人だけ提出）では空。
 */
export function getRevealOrder(
  battle: Pick<BattleSnapshot, "result" | "scores" | "participantIds">,
): RevealEntry[] {
  if (!battle.result || !battle.scores) return [];
  const seat = (id: string) => battle.participantIds.indexOf(id);
  return battle.scores.toSorted(
    (a, b) => submittedAt(a) - submittedAt(b) || seat(a.participantId) - seat(b.participantId),
  );
}
const submittedAt = ({ submission }: RevealEntry) =>
  submission.status === "submitted" ? submission.submittedAt : submission.decidedAt;

export type RevealStage =
  | { kind: "final" }
  | {
      kind: "reveal";
      /** 発表している人の位置（`getRevealOrder`の順）。 */
      index: number;
      phase: "intro" | "judging" | "score";
      /** 採点の様子で、いま採点している指標の位置（`scoringMetrics`の順）。ほかの段階では0。 */
      step: number;
      /** 採点中の指標の進み具合（0〜1）。ほかの段階では0。 */
      stepProgress: number;
      /** その人の枠の始まりからの経過（ms）。 */
      offsetMs: number;
      /** 発表全体の進み具合（0〜1）。 */
      progress: number;
    };

/**
 * 結果の確定からの経過時間で、誰の何の段階かを決める。全員の画面で同じ値になる。
 * 確定前（負の経過）は1人目の呼び出しとして扱う。
 */
export function getRevealStage(
  count: number,
  elapsedMs: number,
  timing: RevealTiming = revealTiming,
): RevealStage {
  const slot = slotMs(timing);
  if (count <= 0 || elapsedMs >= count * slot) return { kind: "final" };
  const clamped = Math.max(0, elapsedMs);
  const index = Math.floor(clamped / slot);
  const offset = clamped - index * slot;
  const base = {
    kind: "reveal",
    index,
    offsetMs: offset,
    progress: clamped / (count * slot),
  } as const;
  if (offset < timing.introMs) return { ...base, phase: "intro", step: 0, stepProgress: 0 };
  const judging = offset - timing.introMs;
  if (judging < timing.judgingMs) {
    const stepMs = timing.judgingMs / metricCount;
    const step = Math.min(metricCount - 1, Math.floor(judging / stepMs));
    return { ...base, phase: "judging", step, stepProgress: (judging - step * stepMs) / stepMs };
  }
  return { ...base, phase: "score", step: 0, stepProgress: 0 };
}

/** 発表が終わる時刻。これを過ぎてから開いた人には最終の結果だけを出す。 */
export function getRevealEndsAt(
  count: number,
  decidedAt: number,
  timing: RevealTiming = revealTiming,
) {
  return decidedAt + count * slotMs(timing);
}

/** 先頭から`revealed`人目までの中での順位。同点は同じ順位（最終の順位と同じ規則）。 */
export function getInterimRanks(
  order: readonly Pick<RevealEntry, "participantId" | "total">[],
  revealed: number,
): Map<string, number> {
  const shown = order.slice(0, Math.max(0, revealed));
  return new Map(
    shown.map((entry) => [
      entry.participantId,
      1 + shown.filter((other) => other.total > entry.total).length,
    ]),
  );
}
