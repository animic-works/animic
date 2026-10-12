import { scoringMetrics } from "../scoring/scoring-metrics";
import type { BattleSnapshot } from "./battle-state";

/** 発表の対象。提出して採点できた人（配信の`scores`にいる人）。 */
export type RevealEntry = NonNullable<BattleSnapshot["scores"]>[number];

/**
 * 結果発表の時間。1人分の枠を、名前の呼び出し・採点の様子・点数の3段階に分ける。点数の段階は、数え上げの後の余韻を含む。
 * 採点の様子は指標の数で等分し、指標を1つずつ「採点中→済み」にする。
 */
export const revealTiming = {
  introMs: 1_600,
  judgingMs: 5_500,
  scoreMs: 3_600,
  // 点数・ボーナス・順位が出そろった後、次の人に移るまでの余韻。点数の段階のまま止めておく。
  holdMs: 1_800,
} as const;
export type RevealTiming = { introMs: number; judgingMs: number; scoreMs: number; holdMs: number };

const metricCount = scoringMetrics.length;
const slotMs = (timing: RevealTiming) =>
  timing.introMs + timing.judgingMs + timing.scoreMs + timing.holdMs;

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

/** 点数の段階の中の時間。再現度を数え上げた後、取ったボーナスを1つずつ加える。点数の段階（`scoreMs`）の中に収める。 */
export const scoreCountTiming = {
  similarityMs: 1_200,
  bonusStartMs: 1_400,
  bonusGapMs: 600,
  bonusCountMs: 400,
} as const;

/** 発表で加えるボーナス。取った（0点より多い）ものだけ、最速提出・最少生成の順に並べる。 */
export function getRevealBonuses(entry: Pick<RevealEntry, "speedBonus" | "generationBonus">) {
  return [
    { id: "speed", label: "最速提出", points: entry.speedBonus ?? 0 },
    { id: "generation", label: "最少生成", points: entry.generationBonus ?? 0 },
  ].filter((bonus) => bonus.points > 0);
}

const easeOut = (progress: number) => 1 - (1 - Math.min(1, Math.max(0, progress))) ** 4;

/**
 * 点数の段階に入ってからの経過で、数え上げている点数と、出したボーナスの数を決める。
 * `settled`は、再現度とボーナスを数え終えたか。
 */
export function getScoreCount(similarity: number, bonuses: readonly number[], elapsedMs: number) {
  const t = scoreCountTiming;
  let value = similarity * easeOut(elapsedMs / t.similarityMs);
  let shown = 0;
  for (const [index, points] of bonuses.entries()) {
    const start = t.bonusStartMs + index * t.bonusGapMs;
    if (elapsedMs < start) break;
    shown = index + 1;
    value += points * easeOut((elapsedMs - start) / t.bonusCountMs);
  }
  const end = bonuses.length
    ? t.bonusStartMs + (bonuses.length - 1) * t.bonusGapMs + t.bonusCountMs
    : t.similarityMs;
  return { value, bonuses: shown, settled: elapsedMs >= end };
}

/**
 * 点数を数え終えた人の数。発表している人は、点数の段階で再現度とボーナスを数え終えた時点（`getScoreCount`の`settled`）で数に入れる。
 * 発表の順番の列の「発表済み」・最終スコア・途中の順位と、採点パネルの下の順位の帯は、この数で出す。
 */
export function getRevealedCount(
  order: readonly Pick<RevealEntry, "similarity" | "speedBonus" | "generationBonus">[],
  stage: Extract<RevealStage, { kind: "reveal" }>,
  timing: RevealTiming = revealTiming,
) {
  const entry = order.at(stage.index);
  const settled =
    stage.phase === "score" &&
    entry !== undefined &&
    getScoreCount(
      entry.similarity,
      getRevealBonuses(entry).map((bonus) => bonus.points),
      stage.offsetMs - timing.introMs - timing.judgingMs,
    ).settled;
  return stage.index + (settled ? 1 : 0);
}
