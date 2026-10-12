import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { scoringWeightsSchema, type ScoringMetricsReport } from "./scoring-metrics";
import { scoringJob, scoringResult } from "./scoring.schema";
import { loadScoringWeights } from "./scoring-weights.server";
import {
  readScoringMetrics,
  readScoringTotals,
  scoringInputsSchema,
  scoringWorkflowVersion,
} from "./scoring-workflows";
import type { ScoringInputs } from "./scoring-workflows";

const leaseMs = 2 * 60_000;
const maxAttempts = 2;

type ScoringRequest = {
  jobId: string;
  participantId: string;
  topicImageUrl: string;
  submissionImageUrl: string;
};

/** 採点ジョブを登録する。再現度の計算には、対戦を始めた時点（`startedAt`）の重みを写して使う。 */
export async function registerScoringJobs(
  db: D1Database,
  battleId: string,
  roomCode: string,
  startedAt: number,
  requests: ScoringRequest[],
) {
  if (!requests.length) return;
  const createdAt = new Date();
  const { weights } = await loadScoringWeights(db, new Date(startedAt));
  await drizzle(db)
    .insert(scoringJob)
    .values(
      requests.map((request) => {
        const inputs: ScoringInputs = [
          { role: "topic", imageUrl: request.topicImageUrl },
          {
            role: "submission",
            participantId: request.participantId,
            imageUrl: request.submissionImageUrl,
          },
        ];
        return {
          id: request.jobId,
          battleId,
          roomCode,
          workflowVersion: scoringWorkflowVersion,
          inputs: JSON.stringify(inputs),
          state: "queued" as const,
          createdAt,
          weights: JSON.stringify(weights),
        };
      }),
    )
    .onConflictDoNothing({ target: scoringJob.id });
}

export async function getScoringJobs(db: D1Database, ids: string[]) {
  const client = drizzle(db);
  const [jobs, results] = await client.batch([
    client
      .select({ id: scoringJob.id, state: scoringJob.state })
      .from(scoringJob)
      .where(inArray(scoringJob.id, ids)),
    client.select().from(scoringResult).where(inArray(scoringResult.jobId, ids)),
  ]);
  return jobs.map((job) => ({
    ...job,
    totals: results
      .filter((result) => result.jobId === job.id)
      .map(({ participantId, total }) => ({ participantId, total })),
  }));
}

// 試行回数が残っていれば待機中に戻し、使い切っていれば失敗として確定する。
function released(error: string, now: number) {
  const exhausted = sql`${scoringJob.attempts} >= ${maxAttempts}`;
  return {
    state: sql`CASE WHEN ${exhausted} THEN 'failed' ELSE 'queued' END`,
    workerId: sql`CASE WHEN ${exhausted} THEN ${scoringJob.workerId} END`,
    leaseUntil: null,
    finishedAt: sql`CASE WHEN ${exhausted} THEN ${now} END`,
    error,
  };
}

function assignedTo(workerId: string, jobId: string) {
  return and(
    eq(scoringJob.id, jobId),
    eq(scoringJob.workerId, workerId),
    eq(scoringJob.state, "running"),
  );
}

// 結果が確定した対戦のジョブを割り当てないよう、終わっていないジョブを失敗として確定する。
export async function cancelScoringJobs(db: D1Database, battleId: string) {
  await drizzle(db)
    .update(scoringJob)
    .set({
      state: "failed",
      leaseUntil: null,
      finishedAt: new Date(),
      error: "対戦の結果が確定したため取り消しました。",
    })
    .where(
      and(eq(scoringJob.battleId, battleId), inArray(scoringJob.state, ["queued", "running"])),
    );
}

export async function claimScoringJob(db: D1Database, workerId: string) {
  const client = drizzle(db);
  const now = Date.now();
  await client
    .update(scoringJob)
    .set(released("割り当ての期限までに完了しませんでした。", now))
    .where(and(eq(scoringJob.state, "running"), lt(scoringJob.leaseUntil, new Date(now))));
  // D1は1つのDBでクエリを1件ずつ処理するため、1文の更新で同じジョブを2台に割り当てない。
  const [job] = await client
    .update(scoringJob)
    .set({
      state: "running",
      workerId,
      attempts: sql`${scoringJob.attempts} + 1`,
      claimedAt: new Date(now),
      leaseUntil: new Date(now + leaseMs),
    })
    .where(
      and(
        eq(scoringJob.state, "queued"),
        inArray(
          scoringJob.id,
          client
            .select({ id: scoringJob.id })
            .from(scoringJob)
            .where(eq(scoringJob.state, "queued"))
            .orderBy(asc(scoringJob.createdAt), asc(scoringJob.id))
            .limit(1),
        ),
      ),
    )
    .returning({
      id: scoringJob.id,
      workflowVersion: scoringJob.workflowVersion,
      inputs: scoringJob.inputs,
    });
  return job ?? null;
}

export async function releaseScoringJob(
  db: D1Database,
  workerId: string,
  jobId: string,
  error: string,
  rawResult: string | null = null,
) {
  const updated = await drizzle(db)
    .update(scoringJob)
    .set({ ...released(error, Date.now()), rawResult })
    .where(assignedTo(workerId, jobId))
    .returning({ id: scoringJob.id });
  return updated.length > 0;
}

export async function completeScoringJob(
  db: D1Database,
  workerId: string,
  jobId: string,
  data: unknown[],
) {
  const client = drizzle(db);
  const [job] = await client
    .select({
      workflowVersion: scoringJob.workflowVersion,
      inputs: scoringJob.inputs,
      weights: scoringJob.weights,
    })
    .from(scoringJob)
    .where(assignedTo(workerId, jobId));
  if (!job) return false;
  const rawResult = JSON.stringify(data);
  const inputs = v.safeParse(scoringInputsSchema, JSON.parse(job.inputs));
  // 重みを写す前に登録したジョブは、採点ノードの`total`を使う。
  const weights = job.weights ? v.parse(scoringWeightsSchema, JSON.parse(job.weights)) : null;
  const totals = inputs.success
    ? readScoringTotals(job.workflowVersion, inputs.output, data, weights)
    : null;
  if (!totals?.length)
    return releaseScoringJob(
      db,
      workerId,
      jobId,
      weights
        ? "採点結果から指標の点を読み取れませんでした。"
        : "採点結果からtotalを読み取れませんでした。",
      rawResult,
    );
  await client.batch([
    client
      .insert(scoringResult)
      .values(totals.map((item) => ({ jobId, ...item })))
      .onConflictDoNothing(),
    client
      .update(scoringJob)
      .set({
        state: "succeeded",
        leaseUntil: null,
        finishedAt: new Date(),
        rawResult,
        error: null,
      })
      .where(assignedTo(workerId, jobId)),
  ]);
  return true;
}

/**
 * 対戦で採点に成功した参加者の、指標ごとの点と対戦を始めたときの重み。採点されていなければ`null`。
 * 本人の分だけを読む。ほかの参加者の指標は返さない。
 */
export async function getScoringMetrics(
  db: D1Database,
  battleId: string,
  participantId: string,
): Promise<ScoringMetricsReport | null> {
  const [row] = await drizzle(db)
    .select({
      workflowVersion: scoringJob.workflowVersion,
      rawResult: scoringJob.rawResult,
      weights: scoringJob.weights,
    })
    .from(scoringJob)
    .innerJoin(scoringResult, eq(scoringResult.jobId, scoringJob.id))
    .where(
      and(
        eq(scoringJob.battleId, battleId),
        eq(scoringJob.state, "succeeded"),
        eq(scoringResult.participantId, participantId),
      ),
    )
    .limit(1);
  const scores = row?.rawResult
    ? readScoringMetrics(row.workflowVersion, JSON.parse(row.rawResult))
    : null;
  if (!scores) return null;
  const weights = row?.weights ? v.safeParse(scoringWeightsSchema, JSON.parse(row.weights)) : null;
  return { scores, weights: weights?.success ? weights.output : null };
}
