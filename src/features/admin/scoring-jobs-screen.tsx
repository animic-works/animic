import { useState } from "react";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { DataTable, type DataTableColumn } from "@animic/react/data-table";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import type { getScoringAdminData } from "../scoring/scoring-admin.functions";
import { errorMessage, formatDateTime } from "./admin-format";
import { AdminHead } from "./admin-parts";
type ScoringAdminData = Awaited<ReturnType<typeof getScoringAdminData>>;
type ScoringJob = ScoringAdminData["jobs"][number];

// 採点ジョブの状態の札
function StateBadge({ state }: { state: ScoringJob["state"] }) {
  if (state === "running")
    return (
      <Badge tone="highlight" size="sm">
        実行中
      </Badge>
    );
  if (state === "succeeded")
    return (
      <Badge tone="success" size="sm">
        成功
      </Badge>
    );
  if (state === "failed")
    return (
      <Badge tone="danger" size="sm">
        失敗
      </Badge>
    );
  return <Badge size="sm">待機中</Badge>;
}

// 参加者ごとのtotalを「participantId: total」で並べる。なければ「—」
function totalsText(totals: ScoringJob["totals"]) {
  if (!totals.length) return "—";
  return totals.map((item) => `${item.participantId}: ${item.total}`).join("、");
}

const jobColumns: DataTableColumn<ScoringJob>[] = [
  { id: "state", header: "状態", cell: (job) => <StateBadge state={job.state} /> },
  {
    id: "battle",
    header: "対戦ID",
    rowHeader: true,
    cell: (job) => <Text variant="code.compact">{job.battleId}</Text>,
  },
  { id: "worker", header: "採点ワーカー", cell: (job) => job.workerName ?? "—" },
  { id: "attempts", header: "試行", cell: (job) => job.attempts },
  { id: "created", header: "登録日時", cell: (job) => formatDateTime(job.createdAt) },
  { id: "finished", header: "確定日時", cell: (job) => formatDateTime(job.finishedAt) },
  { id: "error", header: "失敗の理由", cell: (job) => job.error ?? "—" },
  { id: "totals", header: "total", cell: (job) => totalsText(job.totals) },
];

export function ScoringJobsScreen({
  jobs,
  onRefresh,
}: {
  jobs: ScoringAdminData["jobs"];
  onRefresh: () => Promise<void>;
}) {
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      toast.show({ title: errorMessage(error) });
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
          <Button appearance="secondary" loading={refreshing} onClick={() => void refresh()}>
            最新の状態にする
          </Button>
        }
      />
      <DataTable
        label="採点ジョブ"
        rows={jobs}
        getRowKey={(job) => job.id}
        empty="採点ジョブはまだありません"
        columns={jobColumns}
      />
    </>
  );
}
