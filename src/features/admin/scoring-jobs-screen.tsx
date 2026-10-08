import { useState } from "react";

import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { DataCell, DataCode, DataRow, DataTable } from "../../components/data-table";
import { EmptyState } from "../../components/empty-state";
import { Icon } from "../../components/icon";
import type { getScoringAdminData } from "../scoring/scoring-admin.functions";
import { formatDateTime } from "./admin-format";
import { AdminHead } from "./admin-parts";

type ScoringAdminData = Awaited<ReturnType<typeof getScoringAdminData>>;
type ScoringJob = ScoringAdminData["jobs"][number];

// 採点ジョブの状態の札
function StateBadge({ state }: { state: ScoringJob["state"] }) {
  if (state === "running")
    return (
      <Badge tone="info" size="sm">
        実行中
      </Badge>
    );
  if (state === "succeeded")
    return (
      <Badge tone="success" variant="solid" size="sm">
        成功
      </Badge>
    );
  if (state === "failed")
    return (
      <Badge tone="danger" size="sm">
        失敗
      </Badge>
    );
  return (
    <Badge variant="outline" size="sm">
      待機中
    </Badge>
  );
}

// 参加者ごとのtotalを「participantId: total」で並べる。なければ「—」
function totalsText(totals: ScoringJob["totals"]) {
  if (!totals.length) return "—";
  return totals.map((item) => `${item.participantId}: ${item.total}`).join("、");
}

export function ScoringJobsScreen({
  jobs,
  onRefresh,
}: {
  jobs: ScoringAdminData["jobs"];
  onRefresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <AdminHead
        eyebrow="Admin"
        title="採点ジョブ"
        description="新しい順に最大100件を表示します。"
        actions={
          <Button
            variant="secondary"
            leadingIcon={<Icon name="refresh" size="md" />}
            loading={refreshing}
            onClick={() => void refresh()}
          >
            最新の状態にする
          </Button>
        }
      />
      {jobs.length === 0 ? (
        <EmptyState title="採点ジョブはまだありません" />
      ) : (
        <DataTable
          caption="採点ジョブ"
          overflow="scroll"
          columns={[
            "状態",
            "対戦ID",
            "採点ワーカー",
            "試行",
            "登録日時",
            "確定日時",
            "失敗の理由",
            "total",
          ]}
        >
          {jobs.map((job) => (
            <DataRow key={job.id}>
              <DataCell>
                <StateBadge state={job.state} />
              </DataCell>
              <DataCell header>
                <DataCode>{job.battleId}</DataCode>
              </DataCell>
              <DataCell>{job.workerName ?? "—"}</DataCell>
              <DataCell kind="number">{job.attempts}</DataCell>
              <DataCell>{formatDateTime(job.createdAt)}</DataCell>
              <DataCell>{formatDateTime(job.finishedAt)}</DataCell>
              <DataCell>{job.error ?? "—"}</DataCell>
              <DataCell>{totalsText(job.totals)}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      )}
    </>
  );
}
