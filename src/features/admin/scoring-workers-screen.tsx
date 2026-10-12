import { useState, type FormEvent } from "react";
import * as v from "valibot";
import { ActionGroup } from "@animic/react/action-group";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { DataTable, type DataTableColumn } from "@animic/react/data-table";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import {
  issueScoringLinkCode,
  revokeScoringWorker,
  workerNameSchema,
} from "../scoring/scoring-admin.functions";
import type { getScoringAdminData } from "../scoring/scoring-admin.functions";
import { errorMessage, formatDateTime } from "./admin-format";
import { AdminError, AdminGuide, AdminHead } from "./admin-parts";
type ScoringAdminData = Awaited<ReturnType<typeof getScoringAdminData>>;
type ScoringWorker = ScoringAdminData["workers"][number];

// GPUの表示（名前と空き／全体のVRAM）。情報がなければ「—」
function gpuText(status: ScoringWorker["status"]) {
  const gpu = status?.gpu;
  if (!gpu) return "—";
  return `${gpu.name}（空き${Math.round(gpu.vramFree / 1024 ** 3)}GB／${Math.round(gpu.vramTotal / 1024 ** 3)}GB）`;
}

const guideItems = [
  {
    term: "リンクコード",
    body: "コードは10分間有効で、1回だけ使えます。desktop-comfyui-serverのサーバー設定で入力します。",
  },
  {
    term: "失効",
    body: "失効させた採点ワーカーの要求は拒否されます。割り当て中のジョブは期限が切れると待機中に戻ります。",
  },
];

function workerColumns(
  onRevoke: (worker: ScoringWorker) => void,
): DataTableColumn<ScoringWorker>[] {
  return [
    { id: "name", header: "名前", rowHeader: true, cell: (worker) => worker.name },
    {
      id: "created",
      header: "登録日時",
      cell: (worker) => formatDateTime(worker.createdAt),
    },
    {
      id: "seen",
      header: "最後のheartbeat",
      cell: (worker) => formatDateTime(worker.lastSeenAt),
    },
    {
      id: "comfy",
      header: "ComfyUI",
      cell: (worker) => worker.status?.comfyStatus ?? "—",
    },
    { id: "gpu", header: "GPU", cell: (worker) => gpuText(worker.status) },
    {
      id: "state",
      header: "状態",
      cell: (worker) =>
        worker.revokedAt === null ? (
          <Badge tone="success" size="sm">
            有効
          </Badge>
        ) : (
          <Text variant="caption" tone="muted">
            失効（{formatDateTime(worker.revokedAt)}）
          </Text>
        ),
    },
    {
      id: "action",
      header: "操作",
      cell: (worker) =>
        worker.revokedAt === null ? (
          <Button appearance="outlined" size="xs" onClick={() => onRevoke(worker)}>
            失効させる
          </Button>
        ) : null,
    },
  ];
}

export function ScoringWorkersScreen({
  workers,
  onChanged,
}: {
  workers: ScoringAdminData["workers"];
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Awaited<ReturnType<typeof issueScoringLinkCode>> | null>(
    null,
  );
  const [issuing, setIssuing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // 閉じる動きの間も名前を出すため、対象と開閉を分けて持つ
  const [revoking, setRevoking] = useState<ScoringWorker | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokingBusy, setRevokingBusy] = useState(false);

  function openRevoke(worker: ScoringWorker) {
    setRevoking(worker);
    setRevokeError(null);
    setConfirmOpen(true);
  }

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = v.safeParse(workerNameSchema, name);
    if (!parsed.success) {
      setNameError(parsed.issues[0].message);
      return;
    }
    setNameError(null);
    setIssuing(true);
    try {
      setIssued(await issueScoringLinkCode({ data: { name: parsed.output } }));
      setName("");
    } catch (error) {
      setNameError(errorMessage(error));
    } finally {
      setIssuing(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await onChanged();
    } catch (error) {
      toast.show({ title: errorMessage(error) });
    } finally {
      setRefreshing(false);
    }
  }

  async function revoke() {
    const target = revoking;
    if (!target) return;
    setRevokingBusy(true);
    setRevokeError(null);
    try {
      await revokeScoringWorker({ data: { id: target.id } });
      setConfirmOpen(false);
      await onChanged();
      toast.show({ title: "失効させました" });
    } catch (error) {
      setRevokeError(errorMessage(error));
    } finally {
      setRevokingBusy(false);
    }
  }

  return (
    <>
      <AdminHead
        eyebrow="Admin"
        title="採点ワーカー"
        actions={
          <Button appearance="secondary" loading={refreshing} onClick={() => void refresh()}>
            最新の状態にする
          </Button>
        }
      />
      <Split layout="main-aside" align="start">
        <Stack space="section">
          <section aria-label="リンクコードの発行">
            <Surface appearance="subtle">
              <Stack>
                <Heading level={2} size="sm">
                  リンクコードの発行
                </Heading>
                <form onSubmit={(event) => void issue(event)}>
                  <Stack>
                    <Field label="採点ワーカーの名前" error={nameError ?? undefined}>
                      <Input value={name} onChange={(event) => setName(event.target.value)} />
                    </Field>
                    <ActionGroup>
                      <Button type="submit" loading={issuing}>
                        発行する
                      </Button>
                    </ActionGroup>
                  </Stack>
                </form>
                {issued && (
                  <Stack space="tight">
                    <output aria-label="リンクコード">
                      <Text variant="code">{issued.code}</Text>
                    </output>
                    <Text variant="caption" tone="muted">
                      {formatDateTime(issued.expiresAt)}まで、1回だけ使えます
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Surface>
          </section>
          <DataTable
            label="採点ワーカー"
            rows={workers}
            getRowKey={(worker) => worker.id}
            empty="採点ワーカーはまだ登録されていません"
            columns={workerColumns(openRevoke)}
          />
        </Stack>
        <AdminGuide items={guideItems} />
      </Split>
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!revokingBusy) setConfirmOpen(open);
        }}
        title="採点ワーカーを失効させますか？"
        description={`「${revoking?.name ?? ""}」からの要求を以後すべて拒否します。`}
        size="compact"
        presentation="centered"
        footer={
          <ActionGroup>
            <Button
              appearance="secondary"
              loading={revokingBusy}
              onClick={() => setConfirmOpen(false)}
            >
              やめる
            </Button>
            <Button loading={revokingBusy} onClick={() => void revoke()}>
              失効させる
            </Button>
          </ActionGroup>
        }
      >
        <AdminError>{revokeError}</AdminError>
      </Dialog>
    </>
  );
}
