import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import { scoringJob, scoringLinkCode, scoringResult, scoringWorker } from "./scoring.schema";

const linkCodeMs = 10 * 60_000;
// 32文字なので、乱数の下位5ビットで偏りなく選べる。8文字で約1兆通り。
const linkCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const workerNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "名前を入力してください。"),
  v.maxLength(40, "名前は40文字以内で入力してください。"),
);
const workerStatusSchema = v.object({
  comfyStatus: v.string(),
  gpu: v.optional(
    v.nullable(v.object({ name: v.string(), vramTotal: v.number(), vramFree: v.number() })),
    null,
  ),
});

function createLinkCode() {
  const chars = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) =>
    linkCodeAlphabet.charAt(byte & 31),
  ).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

function readWorkerStatus(status: string | null) {
  if (!status) return null;
  try {
    const parsed = v.safeParse(workerStatusSchema, JSON.parse(status));
    return parsed.success ? parsed.output : null;
  } catch {
    return null;
  }
}

export const issueScoringLinkCode = createServerFn({ method: "POST" })
  .validator(v.object({ name: workerNameSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    const expiresAt = new Date(Date.now() + linkCodeMs);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = createLinkCode();
      const inserted = await drizzle(env.DB)
        .insert(scoringLinkCode)
        .values({ code, name: data.name, expiresAt })
        .onConflictDoNothing()
        .returning({ code: scoringLinkCode.code });
      if (inserted.length) return { code, expiresAt };
    }
    throw new Error("リンクコードを発行できませんでした。もう一度お試しください。");
  });

export const getScoringAdminData = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = drizzle(env.DB);
  const [workers, jobs] = await db.batch([
    db
      .select({
        id: scoringWorker.id,
        name: scoringWorker.name,
        createdAt: scoringWorker.createdAt,
        lastSeenAt: scoringWorker.lastSeenAt,
        status: scoringWorker.status,
        revokedAt: scoringWorker.revokedAt,
      })
      .from(scoringWorker)
      .orderBy(desc(scoringWorker.createdAt)),
    db
      .select({
        id: scoringJob.id,
        state: scoringJob.state,
        battleId: scoringJob.battleId,
        workerName: scoringWorker.name,
        attempts: scoringJob.attempts,
        createdAt: scoringJob.createdAt,
        finishedAt: scoringJob.finishedAt,
        error: scoringJob.error,
      })
      .from(scoringJob)
      .leftJoin(scoringWorker, eq(scoringJob.workerId, scoringWorker.id))
      .orderBy(desc(scoringJob.createdAt))
      .limit(100),
  ]);
  // D1のバインド変数は1クエリ100個までなので、ジョブの件数も100件に抑えている。
  const totals = jobs.length
    ? await db
        .select()
        .from(scoringResult)
        .where(
          inArray(
            scoringResult.jobId,
            jobs.map((job) => job.id),
          ),
        )
    : [];
  return {
    workers: workers.map((worker) => ({ ...worker, status: readWorkerStatus(worker.status) })),
    jobs: jobs.map((job) => ({
      ...job,
      totals: totals
        .filter((result) => result.jobId === job.id)
        .map(({ participantId, total }) => ({ participantId, total })),
    })),
  };
});

export const revokeScoringWorker = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.pipe(v.string(), v.uuid()) }))
  .handler(async ({ data }) => {
    requireAdmin();
    await drizzle(env.DB)
      .update(scoringWorker)
      .set({ revokedAt: new Date() })
      .where(and(eq(scoringWorker.id, data.id), isNull(scoringWorker.revokedAt)));
  });
