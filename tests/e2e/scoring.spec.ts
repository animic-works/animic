import * as v from "valibot";
import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

import { executeLocalD1 } from "./d1";

const origin = "http://127.0.0.1:4173";
// desktop-comfyui-serverの通信仕様で決まっているパスとキー名で、採点ワーカーとして振る舞う。
const workerApi = "/api/internal/hosts";
const linkedSchema = v.object({ hostId: v.string(), hostSecret: v.string(), hostName: v.string() });
const claimedSchema = v.object({
  jobId: v.string(),
  sourceImages: v.array(
    v.object({ base64: v.pipe(v.string(), v.minLength(1)), contentType: v.string() }),
  ),
  workflow: v.object({ presetId: v.string(), workflowJson: v.string(), triggerWords: v.null() }),
});
const jobSchema = v.object({
  state: v.string(),
  attempts: v.number(),
  worker_id: v.nullable(v.string()),
  raw_result: v.nullable(v.string()),
  error: v.nullable(v.string()),
});
type Worker = { id: string; secret: string };

async function issueCode(code: string, expiresAt = Date.now() + 10 * 60_000) {
  await executeLocalD1(
    `INSERT INTO scoring_link_code (code, name, expires_at) VALUES ('${code}', 'e2e-${code}', ${expiresAt})`,
  );
}

async function link(request: APIRequestContext, code: string): Promise<Worker> {
  await issueCode(code);
  const response = await request.post(`${workerApi}/link`, { data: { code } });
  expect(response.status()).toBe(200);
  const linked = v.parse(linkedSchema, await response.json());
  return { id: linked.hostId, secret: linked.hostSecret };
}

function post(request: APIRequestContext, worker: Worker, path: string, data: unknown = {}) {
  return request.post(`${workerApi}/${worker.id}/${path}`, {
    headers: { Authorization: `Bearer ${worker.secret}` },
    data,
  });
}

async function addJob(id: string, submissionImageUrl = `${origin}/og-image.png`) {
  const inputs = JSON.stringify([
    { role: "topic", imageUrl: `${origin}/og-image.png` },
    { role: "submission", participantId: `participant-${id}`, imageUrl: submissionImageUrl },
  ]);
  await executeLocalD1(
    `INSERT INTO scoring_job (id, battle_id, room_code, workflow_version, inputs, state, created_at) VALUES ('${id}', 'battle-${id}', 'E2EROOM2', 'illust-similarity-v1', '${inputs}', 'queued', ${Date.now()})`,
  );
}

async function job(id: string) {
  return v.parse(
    jobSchema,
    (
      await executeLocalD1(
        `SELECT state, attempts, worker_id, raw_result, error FROM scoring_job WHERE id = '${id}'`,
      )
    )[0],
  );
}

function similarity(text: string) {
  return { data: [{ nodeId: "3", label: "similarity", values: { text: [text] } }] };
}

test.describe.configure({ mode: "serial", timeout: 60_000 });
test.beforeEach(async () => {
  await executeLocalD1("DELETE FROM scoring_job");
});

test("リンクコードは登録済み・未使用・期限内のときだけ1回使え、秘密情報はハッシュだけ保存する", async ({
  request,
}) => {
  await issueCode("E2EA-0001");
  await issueCode("E2EA-0002", Date.now() - 1000);
  const response = await request.post(`${workerApi}/link`, { data: { code: " e2ea-0001 " } });
  expect(response.status()).toBe(200);
  const linked = v.parse(linkedSchema, await response.json());
  expect(linked.hostName).toBe("e2e-E2EA-0001");
  expect(linked.hostSecret).toMatch(/^[0-9a-f]{64}$/);
  const stored = await executeLocalD1(
    `SELECT secret_hash FROM scoring_worker WHERE id = '${linked.hostId}'`,
  );
  expect(stored).toHaveLength(1);
  expect(stored[0]?.secret_hash).not.toBe(linked.hostSecret);
  for (const data of [{ code: "E2EA-0001" }, { code: "E2EA-0002" }, { code: "E2EA-9999" }, {}]) {
    const refused = await request.post(`${workerApi}/link`, { data });
    expect(refused.status()).toBe(400);
    expect(await refused.json()).toEqual({
      error: "リンクコードが正しくないか、期限切れか、使用済みです。",
    });
  }
});

test("秘密情報を確かめてheartbeatを記録し、失効した採点ワーカーを拒否する", async ({ request }) => {
  const worker = await link(request, "E2EB-0001");
  const status = { comfyStatus: "available", queueRunning: 0, queuePending: 0, gpu: null };
  expect((await post(request, { ...worker, secret: "wrong" }, "heartbeat", status)).status()).toBe(
    401,
  );
  expect(
    (await request.post(`${workerApi}/${worker.id}/heartbeat`, { data: status })).status(),
  ).toBe(401);
  const beat = await post(request, worker, "heartbeat", status);
  expect(beat.status()).toBe(200);
  expect(await beat.json()).toEqual({});
  const recorded = await executeLocalD1(
    `SELECT last_seen_at, status FROM scoring_worker WHERE id = '${worker.id}'`,
  );
  expect(recorded[0]?.last_seen_at).not.toBeNull();
  expect(String(recorded[0]?.status)).toContain('"comfyStatus":"available"');
  expect((await post(request, worker, "heartbeat", { comfyStatus: "unknown" })).status()).toBe(400);
  const headers = { Authorization: `Bearer ${worker.secret}` };
  expect((await request.get(`${workerApi}/${worker.id}/manifest`, { headers })).status()).toBe(404);
  expect(
    (await request.put(`${workerApi}/${worker.id}/object-info`, { headers, data: {} })).status(),
  ).toBe(404);
  await executeLocalD1(
    `UPDATE scoring_worker SET revoked_at = ${Date.now()} WHERE id = '${worker.id}'`,
  );
  expect((await post(request, worker, "heartbeat", status)).status()).toBe(401);
});

test("Originのない要求も受け付け、待機中のジョブを1台だけに割り当てて完了を保存する", async ({
  request,
}) => {
  const first = await link(request, "E2EC-0001");
  const second = await link(request, "E2EC-0002");
  expect((await post(request, first, "jobs/claim")).status()).toBe(204);
  await addJob("job-complete");
  const response = await post(request, first, "jobs/claim");
  expect(response.status()).toBe(200);
  const claimed = v.parse(claimedSchema, await response.json());
  expect(claimed.jobId).toBe("job-complete");
  expect(claimed.sourceImages.map((image) => image.contentType)).toEqual([
    "image/png",
    "image/png",
  ]);
  expect(claimed.workflow.presetId).toBe("illust-similarity-v1");
  expect(JSON.parse(claimed.workflow.workflowJson)).toMatchObject({
    "1": { inputs: { image: "__INPUT_IMAGE__" } },
    "2": { inputs: { image: "__INPUT_IMAGE_2__" } },
  });
  expect((await post(request, second, "jobs/claim")).status()).toBe(204);
  const reported = similarity(JSON.stringify({ depth: { raw: 0.78, score: 67 }, total: 71.4 }));
  expect((await post(request, second, "jobs/job-complete/complete", reported)).status()).toBe(409);
  expect((await post(request, first, "jobs/job-complete/complete", reported)).status()).toBe(200);
  expect(await job("job-complete")).toMatchObject({ state: "succeeded", attempts: 1, error: null });
  expect((await job("job-complete")).raw_result).toContain("71.4");
  expect(
    await executeLocalD1(
      "SELECT participant_id, total FROM scoring_result WHERE job_id = 'job-complete'",
    ),
  ).toEqual([{ participant_id: "participant-job-complete", total: 71.4 }]);
  expect((await post(request, first, "jobs/job-complete/complete", reported)).status()).toBe(409);
  expect((await post(request, first, "jobs/job-complete/fail")).status()).toBe(409);
});

test("失敗・読めない出力・期限切れ・画像の取得失敗は1回だけ差し戻し、2回目で失敗にする", async ({
  request,
}) => {
  const first = await link(request, "E2ED-0001");
  const second = await link(request, "E2ED-0002");

  await addJob("job-retry");
  expect((await post(request, first, "jobs/claim")).status()).toBe(200);
  expect(
    (await post(request, first, "jobs/job-retry/fail", { reason: "ComfyUIが停止" })).status(),
  ).toBe(200);
  expect(await job("job-retry")).toMatchObject({
    state: "queued",
    attempts: 1,
    worker_id: null,
    error: "ComfyUIが停止",
  });
  expect((await post(request, second, "jobs/claim")).status()).toBe(200);
  const unreadable = similarity('{"depth": {"raw": NaN}, "total": NaN}');
  expect((await post(request, second, "jobs/job-retry/complete", unreadable)).status()).toBe(200);
  const failed = await job("job-retry");
  expect(failed).toMatchObject({ state: "failed", attempts: 2, worker_id: second.id });
  expect(failed.raw_result).toContain("NaN");
  expect(failed.error).toContain("total");

  await addJob("job-lease");
  expect((await post(request, first, "jobs/claim")).status()).toBe(200);
  await executeLocalD1(
    `UPDATE scoring_job SET lease_until = ${Date.now() - 1000} WHERE id = 'job-lease'`,
  );
  const reclaimed = await post(request, second, "jobs/claim");
  expect(v.parse(claimedSchema, await reclaimed.json()).jobId).toBe("job-lease");
  expect(await job("job-lease")).toMatchObject({
    state: "running",
    attempts: 2,
    worker_id: second.id,
  });
  expect((await post(request, first, "jobs/job-lease/fail")).status()).toBe(409);

  await addJob("job-image", "https://example.invalid/missing.png");
  expect((await post(request, first, "jobs/claim")).status()).toBe(204);
  const unavailable = await job("job-image");
  expect(unavailable).toMatchObject({ state: "queued", attempts: 1, worker_id: null });
  expect(unavailable.error).toContain("画像");
});
