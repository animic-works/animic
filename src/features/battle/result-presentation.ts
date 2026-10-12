import { scoringMetrics } from "../scoring/scoring-metrics";
import type { BattleSnapshot } from "./battle-state";

/** 発表する人。採点で結果が決まった後に配信される`scores`の1人分。 */
export type RevealEntry = NonNullable<BattleSnapshot["scores"]>[number];

/**
 * 1人分の発表の長さ（ms）。名前の呼び出し・採点の様子・点数の順に進める。
 * 採点の様子は指標の数で等分し、指標を1つずつ「採点中→済み」にする。
 */
export const revealTiming = { callMs: 1_200, judgingMs: 4_000, scoreMs: 2_800 } as const;
type RevealTiming = Record<keyof typeof revealTiming, number>;

const slotMs = (timing: RevealTiming) => timing.callMs + timing.judgingMs + timing.scoreMs;

function submittedAt({ submission }: RevealEntry) {
  return submission.status === "submitted" ? submission.submittedAt : submission.decidedAt;
}

/**
 * 発表の順番。提出時刻の早い順で、同時刻（猶予の期限での自動の提出など）は参加順。
 * `scores`のない結果（勝負不成立・1人だけの提出）では空。
 */
export function getRevealOrder(
  battle: Pick<BattleSnapshot, "scores" | "participantIds">,
): RevealEntry[] {
  const seat = (id: string) => battle.participantIds.indexOf(id);
  return (battle.scores ?? []).toSorted(
    (a, b) => submittedAt(a) - submittedAt(b) || seat(a.participantId) - seat(b.participantId),
  );
}

export type RevealStage =
  | { kind: "final" }
  | {
      kind: "reveal";
      /** 発表している人の位置（`getRevealOrder`の順）。 */
      index: number;
      phase: "call" | "judging" | "score";
      /** 今の段階に入ってからの経過（ms）。 */
      phaseMs: number;
      /** 採点の様子で、採点している指標の位置（`scoringMetrics`の順）。ほかの段階では0。 */
      step: number;
      /** 採点している指標の進み具合（0〜1）。ほかの段階では0。 */
      stepProgress: number;
      /** 発表全体の進み具合（0〜1）。 */
      progress: number;
    };

/**
 * 結果が決まってからの経過で、誰の何の段階かを決める。経過が同じなら全員の画面で同じになる。
 * 結果が決まる前（負の経過）は、1人目の呼び出しとして扱う。
 */
export function getRevealStage(
  count: number,
  elapsedMs: number,
  timing: RevealTiming = revealTiming,
): RevealStage {
  const slot = slotMs(timing);
  if (count <= 0 || elapsedMs >= count * slot) return { kind: "final" };
  const elapsed = Math.max(0, elapsedMs);
  const index = Math.floor(elapsed / slot);
  const offset = elapsed - index * slot;
  const base = { kind: "reveal", index, progress: elapsed / (count * slot) } as const;
  if (offset < timing.callMs)
    return { ...base, phase: "call", phaseMs: offset, step: 0, stepProgress: 0 };
  const judging = offset - timing.callMs;
  if (judging < timing.judgingMs) {
    const stepMs = timing.judgingMs / scoringMetrics.length;
    const step = Math.min(scoringMetrics.length - 1, Math.floor(judging / stepMs));
    return {
      ...base,
      phase: "judging",
      phaseMs: judging,
      step,
      stepProgress: (judging - step * stepMs) / stepMs,
    };
  }
  return { ...base, phase: "score", phaseMs: judging - timing.judgingMs, step: 0, stepProgress: 0 };
}

/** 発表の順番の先頭から`count`人の中での順位。同点は同じ順位（最終の順位と同じ規則）。 */
export function getInterimRanks(
  order: readonly Pick<RevealEntry, "participantId" | "total">[],
  count: number,
): Map<string, number> {
  const shown = order.slice(0, Math.max(0, count));
  return new Map(
    shown.map((entry) => [
      entry.participantId,
      1 + shown.filter((other) => other.total > entry.total).length,
    ]),
  );
}
