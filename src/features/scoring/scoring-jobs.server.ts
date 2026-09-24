import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { scoringJob, scoringResult } from "./scoring.schema";
import {
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

export async function registerScoringJobs(
  db: D1Database,
  battleId: string,
  roomCode: string,
  requests: ScoringRequest[],
) {
  if (!requests.length) return;
  const createdAt = new Date();
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
    .select({ workflowVersion: scoringJob.workflowVersion, inputs: scoringJob.inputs })
    .from(scoringJob)
    .where(assignedTo(workerId, jobId));
  if (!job) return false;
  const rawResult = JSON.stringify(data);
  const inputs = v.safeParse(scoringInputsSchema, JSON.parse(job.inputs));
  const totals = inputs.success
    ? readScoringTotals(job.workflowVersion, inputs.output, data)
    : null;
  if (!totals?.length)
    return releaseScoringJob(
      db,
      workerId,
      jobId,
      "採点結果からtotalを読み取れませんでした。",
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
