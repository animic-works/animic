import * as v from "valibot";

const difficultySchema = v.picklist(["easy", "normal", "hard"]);
export const battleSettingsSchema = v.object({
  difficulty: difficultySchema,
  durationSeconds: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3600)),
  selectionSeconds: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3600)),
});
export const topicSchema = v.object({
  id: v.string(),
  difficulty: difficultySchema,
  imageUrl: v.pipe(v.string(), v.url()),
});
const battleHeaderSchema = v.object({
  id: v.string(),
  previousBattleId: v.optional(v.nullable(v.string()), null),
  topic: topicSchema,
  settings: battleSettingsSchema,
  participantIds: v.array(v.string()),
  startedAt: v.number(),
  generationEndsAt: v.number(),
});
const generationBase = {
  id: v.string(),
  participantId: v.string(),
  inputHash: v.string(),
  acceptedAt: v.number(),
};
const generationSchema = v.variant("status", [
  v.object({ ...generationBase, status: v.literal("pending") }),
  v.object({
    ...generationBase,
    status: v.literal("succeeded"),
    finishedAt: v.number(),
    imageUrl: v.pipe(v.string(), v.url()),
  }),
  v.object({ ...generationBase, status: v.literal("failed"), finishedAt: v.number() }),
]);
const submissionSchema = v.variant("status", [
  v.object({
    participantId: v.string(),
    status: v.literal("submitted"),
    generationId: v.string(),
    submittedAt: v.number(),
    successfulGenerationCount: v.number(),
    eligibleForSpeedBonus: v.boolean(),
  }),
  v.object({
    participantId: v.string(),
    status: v.literal("not-submitted"),
    decidedAt: v.number(),
  }),
]);
const battleResultSchema = v.variant("kind", [
  v.object({
    kind: v.literal("win"),
    reason: v.picklist(["opponent-not-submitted", "higher-score"]),
    winnerId: v.string(),
    decidedAt: v.number(),
  }),
  v.object({
    kind: v.literal("draw"),
    reason: v.literal("same-score"),
    decidedAt: v.number(),
  }),
  v.object({
    kind: v.literal("no-contest"),
    reason: v.picklist(["no-submissions", "scoring-failed"]),
    decidedAt: v.number(),
  }),
]);
const scoringEntryBase = { participantId: v.string(), jobId: v.string() };
const scoringEntrySchema = v.variant("status", [
  v.object({ ...scoringEntryBase, status: v.literal("pending") }),
  v.object({ ...scoringEntryBase, status: v.literal("succeeded"), total: v.number() }),
  v.object({ ...scoringEntryBase, status: v.literal("failed") }),
]);
export const battleStateSchema = v.object({
  ...battleHeaderSchema.entries,
  result: v.optional(v.nullable(battleResultSchema), null),
  generations: v.optional(v.array(generationSchema), []),
  submissions: v.optional(v.array(submissionSchema), []),
  selectionEndsAt: v.optional(v.nullable(v.number()), null),
  scoring: v.optional(
    v.object({ endsAt: v.nullable(v.number()), entries: v.array(scoringEntrySchema) }),
    () => ({ endsAt: null, entries: [] }),
  ),
});
export type BattleState = v.InferOutput<typeof battleStateSchema>;
export type GenerationOutcome = { status: "succeeded"; imageUrl: string } | { status: "failed" };
export type ScoringJobOutcome = {
  id: string;
  state: "queued" | "running" | "succeeded" | "failed";
  totals: { participantId: string; total: number }[];
};
export const battleSnapshotSchema = v.object({
  serverTime: v.number(),
  ...battleHeaderSchema.entries,
  selectionEndsAt: v.nullable(v.number()),
  result: v.nullable(battleResultSchema),
  submissionsClosed: v.boolean(),
  generationClosed: v.boolean(),
  scoringEndsAt: v.nullable(v.number()),
  scores: v.nullable(
    v.array(
      v.object({
        participantId: v.string(),
        total: v.number(),
        imageUrl: v.pipe(v.string(), v.url()),
      }),
    ),
  ),
  myGenerations: v.array(
    v.variant("status", [
      v.omit(generationSchema.options[0], ["inputHash", "participantId"]),
      v.omit(generationSchema.options[1], ["inputHash", "participantId"]),
      v.omit(generationSchema.options[2], ["inputHash", "participantId"]),
    ]),
  ),
  mySubmission: v.nullable(submissionSchema),
});
export type BattleSnapshot = v.InferOutput<typeof battleSnapshotSchema>;

export type BattleSettings = v.InferOutput<typeof battleSettingsSchema>;
export type Topic = v.InferOutput<typeof topicSchema>;

const scoringTimeoutMs = 5 * 60_000;

export function canStartBattle(count: number) {
  return count === 2;
}

export function createBattle(
  settings: BattleSettings,
  topic: Topic,
  participantIds: string[],
  now: number,
  previousBattleId: string | null = null,
): BattleState {
  if (
    !canStartBattle(participantIds.length) ||
    new Set(participantIds).size !== participantIds.length
  ) {
    throw new Error("対戦を開始するには参加者が2人必要です。");
  }
  if (settings.difficulty !== topic.difficulty) throw new Error("お題の難易度が一致しません。");
  return {
    id: crypto.randomUUID(),
    previousBattleId,
    result: null,
    generations: [],
    submissions: [],
    selectionEndsAt: null,
    scoring: { endsAt: null, entries: [] },
    topic: structuredClone(topic),
    settings: structuredClone(settings),
    participantIds: [...participantIds],
    startedAt: now,
    generationEndsAt: now + settings.durationSeconds * 1000,
  };
}

export function reconcileBattle(state: BattleState, now: number): BattleState {
  const next = structuredClone(state);
  if (next.result) return next;
  if (now >= next.generationEndsAt) {
    if (
      next.selectionEndsAt === null &&
      !next.generations.some((item) => item.status === "pending")
    ) {
      const lastFinishedAt = next.generations.reduce(
        (latest, item) => (item.status === "pending" ? latest : Math.max(latest, item.finishedAt)),
        next.generationEndsAt,
      );
      next.selectionEndsAt = lastFinishedAt + next.settings.selectionSeconds * 1000;
    }
    if (next.selectionEndsAt !== null && now >= next.selectionEndsAt) {
      for (const participantId of next.participantIds) {
        if (!next.submissions.some((item) => item.participantId === participantId)) {
          next.submissions.push({
            participantId,
            status: "not-submitted",
            decidedAt: next.selectionEndsAt,
          });
        }
      }
    }
  }
  // 勝敗は1対1のルールで決める。複数人の順位はここでは決めない。
  if (
    next.participantIds.length === 2 &&
    next.participantIds.every((id) => next.submissions.some((item) => item.participantId === id))
  ) {
    const submitted = next.submissions.filter((item) => item.status === "submitted");
    const decidedAt = next.selectionEndsAt;
    if (decidedAt !== null && submitted.length === 0)
      next.result = { kind: "no-contest", reason: "no-submissions", decidedAt };
    else if (decidedAt !== null && submitted.length === 1 && submitted[0])
      next.result = {
        kind: "win",
        reason: "opponent-not-submitted",
        winnerId: submitted[0].participantId,
        decidedAt,
      };
    else if (submitted.length > 1) next.result = decideByScores(next, now);
  }
  return next;
}

// 採点期限は全員の提出状態が確定してから数え、期限までに採点がそろわなければ勝負不成立にする。
function decideByScores(state: BattleState, now: number): BattleState["result"] {
  const settledAt = Math.max(
    ...state.submissions.map((item) =>
      item.status === "submitted" ? item.submittedAt : item.decidedAt,
    ),
  );
  const endsAt = (state.scoring.endsAt ??= settledAt + scoringTimeoutMs);
  const entries = state.submissions
    .filter((item) => item.status === "submitted")
    .map((item) =>
      state.scoring.entries.find((entry) => entry.participantId === item.participantId),
    );
  const totals = entries.flatMap((entry) =>
    entry?.status === "succeeded"
      ? [{ participantId: entry.participantId, total: entry.total }]
      : [],
  );
  if (totals.length === entries.length) {
    const best = Math.max(...totals.map((item) => item.total));
    const leaders = totals.filter((item) => item.total === best);
    return leaders.length === 1 && leaders[0]
      ? { kind: "win", reason: "higher-score", winnerId: leaders[0].participantId, decidedAt: now }
      : { kind: "draw", reason: "same-score", decidedAt: now };
  }
  if (entries.some((entry) => entry?.status === "failed"))
    return { kind: "no-contest", reason: "scoring-failed", decidedAt: now };
  if (now >= endsAt) return { kind: "no-contest", reason: "scoring-failed", decidedAt: endsAt };
  return null;
}

export function acceptGeneration(
  state: BattleState,
  request: { id: string; participantId: string; inputHash: string },
  now: number,
) {
  if (!state.participantIds.includes(request.participantId))
    throw new Error("この対戦の参加者ではありません。");
  const existing = state.generations.find((item) => item.id === request.id);
  if (existing) {
    if (
      existing.participantId !== request.participantId ||
      existing.inputHash !== request.inputHash
    )
      throw new Error("同じ処理IDで別の生成を要求できません。");
    return { battle: reconcileBattle(state, now), accepted: false };
  }
  const next = reconcileBattle(state, now);
  if (
    now < next.startedAt ||
    now >= next.generationEndsAt ||
    next.submissions.some((item) => item.participantId === request.participantId)
  )
    throw new Error("画像生成の受付は終了しています。");
  next.generations.push({ ...request, acceptedAt: now, status: "pending" });
  return { battle: next, accepted: true };
}

export function finishGeneration(
  state: BattleState,
  id: string,
  outcome: GenerationOutcome,
  now: number,
): BattleState {
  const next = structuredClone(state);
  const index = next.generations.findIndex((item) => item.id === id);
  const existing = next.generations[index];
  if (!existing) throw new Error("受け付けていない生成です。");
  if (existing.status !== "pending") return reconcileBattle(next, now);
  if (now < existing.acceptedAt) throw new Error("受付時刻より前には完了できません。");
  next.generations[index] = v.parse(generationSchema, { ...existing, ...outcome, finishedAt: now });
  return reconcileBattle(next, now);
}

export function submitImage(
  state: BattleState,
  participantId: string,
  generationId: string,
  now: number,
): BattleState {
  if (!state.participantIds.includes(participantId))
    throw new Error("この対戦の参加者ではありません。");
  const next = reconcileBattle(state, now);
  const existing = next.submissions.find((item) => item.participantId === participantId);
  if (existing) {
    if (existing.status === "submitted" && existing.generationId === generationId) return next;
    throw new Error("提出は締め切られています。");
  }
  const generation = next.generations.find((item) => item.id === generationId);
  if (
    !generation ||
    generation.participantId !== participantId ||
    generation.status !== "succeeded"
  )
    throw new Error("自分が生成した画像を選んでください。");
  if (now < generation.finishedAt) throw new Error("完成前の画像は提出できません。");
  next.submissions.push({
    participantId,
    status: "submitted",
    generationId,
    submittedAt: now,
    successfulGenerationCount: next.generations.filter(
      (item) => item.participantId === participantId && item.status === "succeeded",
    ).length,
    eligibleForSpeedBonus: now < next.generationEndsAt,
  });
  next.scoring.entries.push({ participantId, jobId: crypto.randomUUID(), status: "pending" });
  return reconcileBattle(next, now);
}

function getSubmittedImageUrl(state: BattleState, participantId: string) {
  const submission = state.submissions.find((item) => item.participantId === participantId);
  if (submission?.status !== "submitted") return null;
  const generation = state.generations.find((item) => item.id === submission.generationId);
  return generation?.status === "succeeded" ? generation.imageUrl : null;
}

export function getScoringRequests(state: BattleState) {
  if (state.result) return [];
  return state.scoring.entries.flatMap((entry) => {
    const submissionImageUrl = getSubmittedImageUrl(state, entry.participantId);
    return entry.status === "pending" && submissionImageUrl
      ? [
          {
            jobId: entry.jobId,
            participantId: entry.participantId,
            topicImageUrl: state.topic.imageUrl,
            submissionImageUrl,
          },
        ]
      : [];
  });
}

export function applyScoringJobs(
  state: BattleState,
  jobs: ScoringJobOutcome[],
  now: number,
): BattleState {
  const next = structuredClone(state);
  if (next.result) return next;
  next.scoring.entries = next.scoring.entries.map((entry) => {
    const job = jobs.find((item) => item.id === entry.jobId);
    if (entry.status !== "pending" || !job) return entry;
    const { participantId, jobId } = entry;
    if (job.state === "failed") return { participantId, jobId, status: "failed" };
    if (job.state !== "succeeded") return entry;
    const total = job.totals.find((item) => item.participantId === participantId)?.total;
    return total === undefined
      ? { participantId, jobId, status: "failed" }
      : { participantId, jobId, status: "succeeded", total };
  });
  return reconcileBattle(next, now);
}

// 採点による勝敗が確定するまで、相手の提出画像と採点結果を公開しない。
function getScores(state: BattleState) {
  const scored =
    state.result?.kind === "draw" ||
    (state.result?.kind === "win" && state.result.reason === "higher-score");
  if (!scored) return null;
  return state.scoring.entries.flatMap((entry) => {
    const imageUrl = getSubmittedImageUrl(state, entry.participantId);
    return entry.status === "succeeded" && imageUrl
      ? [{ participantId: entry.participantId, total: entry.total, imageUrl }]
      : [];
  });
}

export function getBattleSnapshot(
  state: BattleState,
  participantId: string | null,
  now: number,
): BattleSnapshot {
  return v.parse(battleSnapshotSchema, {
    ...state,
    serverTime: now,
    generationClosed: now >= state.generationEndsAt,
    myGenerations: state.generations.filter((item) => item.participantId === participantId),
    mySubmission: state.submissions.find((item) => item.participantId === participantId) ?? null,
    submissionsClosed: state.participantIds.every((id) =>
      state.submissions.some((item) => item.participantId === id),
    ),
    scoringEndsAt: state.scoring.endsAt,
    scores: getScores(state),
  });
}

export function serializeBattleResult(battle: BattleState, roomCode: string): string {
  if (!battle.result) throw new Error("対戦結果が確定していません。");
  return JSON.stringify({
    battleId: battle.id,
    roomCode,
    topic: battle.topic,
    settings: battle.settings,
    participantIds: battle.participantIds,
    submissions: battle.submissions,
    result: battle.result,
    scores:
      getScores(battle)?.map(({ participantId, total }) => ({ participantId, total })) ?? null,
    startedAt: battle.startedAt,
    submittedImages: battle.generations
      .filter(
        (image) =>
          image.status === "succeeded" &&
          battle.submissions.some(
            (item) => item.status === "submitted" && item.generationId === image.id,
          ),
      )
      .map((image) => ({
        id: image.id,
        participantId: image.participantId,
        imageUrl: image.status === "succeeded" ? image.imageUrl : null,
      })),
  });
}

export function canStartAfter(current: BattleState | null, previousBattleId: string | null) {
  return current
    ? current.id === previousBattleId && current.result !== null
    : previousBattleId === null;
}

export function startNextBattle(
  current: BattleState | null,
  previousBattleId: string | null,
  settings: BattleSettings,
  topic: Topic,
  participantIds: string[],
  now: number,
): BattleState {
  if (current && current.previousBattleId === previousBattleId) return current;
  if (!canStartAfter(current, previousBattleId))
    throw new Error("対戦の状態が変わっています。最新の状態を確認してください。");
  return createBattle(settings, topic, participantIds, now, previousBattleId);
}
