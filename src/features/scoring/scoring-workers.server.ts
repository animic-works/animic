import { Buffer } from "node:buffer";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { env } from "cloudflare:workers";
import { and, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { claimScoringJob, completeScoringJob, releaseScoringJob } from "./scoring-jobs.server";
import { scoringLinkCode, scoringWorker } from "./scoring.schema";
import { buildScoringWorkflow, scoringInputsSchema } from "./scoring-workflows";

// desktop-comfyui-serverの通信仕様で決まっているパス。
const basePath = "/api/internal/hosts/";
const maxImageBytes = 10 * 1024 * 1024;
const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const linkSchema = v.object({
  code: v.pipe(v.string(), v.trim(), v.toUpperCase(), v.regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)),
});
const statusSchema = v.object({
  comfyStatus: v.picklist(["available", "busy", "unavailable"]),
  queueRunning: v.optional(v.number(), 0),
  queuePending: v.optional(v.number(), 0),
  gpu: v.optional(
    v.nullable(v.object({ name: v.string(), vramTotal: v.number(), vramFree: v.number() })),
    null,
  ),
  readyModels: v.optional(v.array(v.string())),
});
const completionSchema = v.object({ data: v.optional(v.array(v.unknown()), []) });
const failureSchema = v.object({ reason: v.optional(v.string()) });

export function isScoringWorkerRequest(url: URL) {
  return url.pathname.startsWith(basePath);
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(message: string, status: number) {
  return json({ error: message }, status);
}

async function readJson<TSchema extends v.GenericSchema>(request: Request, schema: TSchema) {
  try {
    const result = v.safeParse(schema, await request.json());
    return result.success ? result.output : null;
  } catch {
    return null;
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

async function link(request: Request) {
  const body = await readJson(request, linkSchema);
  // 未知・期限切れ・使用済みのどれに当たったかを区別させない。
  const invalid = failure("リンクコードが正しくないか、期限切れか、使用済みです。", 400);
  if (!body) return invalid;
  const db = drizzle(env.DB);
  const now = new Date();
  const [code] = await db
    .delete(scoringLinkCode)
    .where(and(eq(scoringLinkCode.code, body.code), gt(scoringLinkCode.expiresAt, now)))
    .returning({ name: scoringLinkCode.name });
  if (!code) return invalid;
  const workerId = crypto.randomUUID();
  const workerSecret = randomBytes(32).toString("hex");
  await db.insert(scoringWorker).values({
    id: workerId,
    name: code.name,
    secretHash: sha256(workerSecret).toString("hex"),
    createdAt: now,
  });
  return json({ hostId: workerId, hostSecret: workerSecret, hostName: code.name });
}

async function authenticate(request: Request, workerId: string) {
  const secret = /^Bearer\s+(\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
  if (!secret) return false;
  const [worker] = await drizzle(env.DB)
    .select({ secretHash: scoringWorker.secretHash, revokedAt: scoringWorker.revokedAt })
    .from(scoringWorker)
    .where(eq(scoringWorker.id, workerId));
  if (!worker || worker.revokedAt) return false;
  const expected = Buffer.from(worker.secretHash, "hex");
  const actual = sha256(secret);
  return expected.byteLength === actual.byteLength && timingSafeEqual(expected, actual);
}

async function fetchImage(url: string) {
  const response = await fetch(url).catch((error: unknown) => {
    throw new Error(`画像を取得できませんでした: ${url}`, { cause: error });
  });
  const contentType = response.headers.get("Content-Type")?.split(";")[0]?.trim() ?? "";
  if (!response.ok || !imageTypes.includes(contentType))
    throw new Error(`画像を取得できませんでした（HTTP ${response.status}）: ${url}`);
  // 大きな画像をメモリへ読み込む前に拒否する。長さが分からない応答は読み込んでから確かめる。
  if (Number(response.headers.get("Content-Length")) > maxImageBytes)
    throw new Error(`画像が10MBを超えています: ${url}`);
  const body = await response.arrayBuffer();
  if (body.byteLength > maxImageBytes) throw new Error(`画像が10MBを超えています: ${url}`);
  return { base64: Buffer.from(body).toString("base64"), contentType };
}

async function claim(workerId: string) {
  const job = await claimScoringJob(env.DB, workerId);
  if (!job) return new Response(null, { status: 204 });
  try {
    const inputs = v.parse(scoringInputsSchema, JSON.parse(job.inputs));
    const workflowJson = buildScoringWorkflow(job.workflowVersion, inputs);
    const sourceImages = await Promise.all(inputs.map((input) => fetchImage(input.imageUrl)));
    return json({
      jobId: job.id,
      sourceImages,
      workflow: { presetId: job.workflowVersion, workflowJson, triggerWords: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "採点ジョブを準備できませんでした。";
    console.error("採点ジョブを準備できませんでした。", { jobId: job.id, message });
    await releaseScoringJob(env.DB, workerId, job.id, message);
    return new Response(null, { status: 204 });
  }
}

export async function handleScoringWorkerRequest(request: Request) {
  let segments: string[];
  try {
    segments = new URL(request.url).pathname
      .slice(basePath.length)
      .split("/")
      .map(decodeURIComponent);
  } catch {
    return failure("見つかりません。", 404);
  }
  const [workerId = "", ...route] = segments;
  if (request.method === "POST" && workerId === "link" && !route.length) return link(request);
  if (!(await authenticate(request, workerId))) return failure("認証に失敗しました。", 401);
  const [resource, jobId, action] = route;
  if (request.method !== "POST") return failure("見つかりません。", 404);

  if (resource === "heartbeat" && route.length === 1) {
    const status = await readJson(request, statusSchema);
    if (!status) return failure("状態の形式が正しくありません。", 400);
    await drizzle(env.DB)
      .update(scoringWorker)
      .set({ lastSeenAt: new Date(), status: JSON.stringify(status) })
      .where(eq(scoringWorker.id, workerId));
    return json({});
  }
  if (resource === "jobs" && jobId === "claim" && route.length === 2) return claim(workerId);
  if (resource === "jobs" && jobId && action === "complete" && route.length === 3) {
    const body = await readJson(request, completionSchema);
    if (!body) return failure("完了の報告の形式が正しくありません。", 400);
    return (await completeScoringJob(env.DB, workerId, jobId, body.data))
      ? json({})
      : failure("このジョブは割り当てられていません。", 409);
  }
  if (resource === "jobs" && jobId && action === "fail" && route.length === 3) {
    const body = await readJson(request, failureSchema);
    const reason = body?.reason?.trim() || "採点ワーカーが失敗の理由を報告しませんでした。";
    return (await releaseScoringJob(env.DB, workerId, jobId, reason))
      ? json({})
      : failure("このジョブは割り当てられていません。", 409);
  }
  return failure("見つかりません。", 404);
}
