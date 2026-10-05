import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import * as v from "valibot";

import {
  issueScoringLinkCode,
  revokeScoringWorker,
  workerNameSchema,
} from "./scoring-admin.functions";
import type { getScoringAdminData } from "./scoring-admin.functions";
import styles from "./scoring-admin.module.css";

type ScoringAdminData = Awaited<ReturnType<typeof getScoringAdminData>>;

// サーバーとブラウザで同じ文字列にし、表示の食い違いを起こさない。
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
  timeStyle: "medium",
});
const jobStates = { queued: "待機中", running: "実行中", succeeded: "成功", failed: "失敗" };

function formatDate(value: Date | null) {
  return value ? dateFormat.format(value) : "—";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作できませんでした。";
}

function LinkCodeForm() {
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<{ code: string; expiresAt: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = v.safeParse(workerNameSchema, name);
    if (!parsed.success) {
      setError(parsed.issues[0].message);
      return;
    }
    setPending(true);
    setError(null);
    try {
      setIssued(await issueScoringLinkCode({ data: { name: parsed.output } }));
      setName("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="link-code" aria-labelledby="link-code-heading" className={styles.section}>
      <h2 id="link-code-heading">リンクコードの発行</h2>
      <form onSubmit={(event) => void submit(event)} className={styles.form}>
        <label>
          採点ワーカーの名前
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" disabled={pending}>
          発行する
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {issued && (
        <p>
          リンクコード: <output className={styles.code}>{issued.code}</output>（
          {formatDate(issued.expiresAt)}まで、1回だけ使えます）
        </p>
      )}
    </section>
  );
}

function Workers({ workers }: Pick<ScoringAdminData, "workers">) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function revoke(id: string, name: string) {
    if (!window.confirm(`採点ワーカー「${name}」を失効させますか？`)) return;
    setError(null);
    try {
      await revokeScoringWorker({ data: { id } });
      await router.invalidate();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <section id="workers" aria-labelledby="workers-heading" className={styles.section}>
      <h2 id="workers-heading">採点ワーカー</h2>
      {error && <p role="alert">{error}</p>}
      {workers.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>名前</th>
                <th>登録日時</th>
                <th>最後のheartbeat</th>
                <th>ComfyUI</th>
                <th>GPU</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.name}</td>
                  <td>{formatDate(worker.createdAt)}</td>
                  <td>{formatDate(worker.lastSeenAt)}</td>
                  <td>{worker.status?.comfyStatus ?? "—"}</td>
                  <td>
                    {worker.status?.gpu
                      ? `${worker.status.gpu.name}（空き${Math.round(worker.status.gpu.vramFree / 1024 ** 3)}GB／${Math.round(worker.status.gpu.vramTotal / 1024 ** 3)}GB）`
                      : "—"}
                  </td>
                  <td>{worker.revokedAt ? `失効（${formatDate(worker.revokedAt)}）` : "有効"}</td>
                  <td>
                    {!worker.revokedAt && (
                      <button type="button" onClick={() => void revoke(worker.id, worker.name)}>
                        失効させる
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>採点ワーカーはまだ登録されていません。</p>
      )}
    </section>
  );
}

function Jobs({ jobs }: Pick<ScoringAdminData, "jobs">) {
  return (
    <section id="jobs" aria-labelledby="jobs-heading" className={styles.section}>
      <h2 id="jobs-heading">採点ジョブ（新しい順に最大100件）</h2>
      {jobs.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>状態</th>
                <th>対戦ID</th>
                <th>採点ワーカー</th>
                <th>試行</th>
                <th>登録日時</th>
                <th>確定日時</th>
                <th>失敗の理由</th>
                <th>total</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{jobStates[job.state]}</td>
                  <td>{job.battleId}</td>
                  <td>{job.workerName ?? "—"}</td>
                  <td>{job.attempts}</td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>{formatDate(job.finishedAt)}</td>
                  <td>{job.error ?? "—"}</td>
                  <td>
                    {job.totals.length
                      ? job.totals.map((item) => `${item.participantId}: ${item.total}`).join("、")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>採点ジョブはまだありません。</p>
      )}
    </section>
  );
}

export function ScoringAdmin({ workers, jobs }: ScoringAdminData) {
  return (
    <>
      <LinkCodeForm />
      <Workers workers={workers} />
      <Jobs jobs={jobs} />
    </>
  );
}
