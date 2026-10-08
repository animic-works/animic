import { useState } from "react";
import type { FormEvent } from "react";
import * as v from "valibot";

import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { DataCell, DataRow, DataTable } from "../../components/data-table";
import { Dialog, DialogClose } from "../../components/dialog";
import { EmptyState } from "../../components/empty-state";
import { TextField } from "../../components/field";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { Surface } from "../../components/surface";
import { Heading, Text } from "../../components/text";
import { toast } from "../../components/toast";
import {
  issueScoringLinkCode,
  revokeScoringWorker,
  workerNameSchema,
} from "../scoring/scoring-admin.functions";
import type { getScoringAdminData } from "../scoring/scoring-admin.functions";
import { errorMessage, formatDateTime } from "./admin-format";
import { AdminColumns, AdminGuide, AdminHead } from "./admin-parts";

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

export function ScoringWorkersScreen({
  workers,
  onChanged,
}: {
  workers: ScoringAdminData["workers"];
  onChanged: () => Promise<void>;
}) {
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
      toast("失効させました");
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
      <AdminColumns
        layout="form"
        primary={
          <Stack gap="6">
            <Surface as="section" variant="soft" padding="lg" aria-label="リンクコードの発行">
              <Stack gap="4">
                <Heading variant="heading-sm">リンクコードの発行</Heading>
                <form onSubmit={(event) => void issue(event)}>
                  <Stack gap="3">
                    <TextField
                      label="採点ワーカーの名前"
                      value={name}
                      invalid={Boolean(nameError)}
                      onChange={(event) => setName(event.target.value)}
                    />
                    {nameError ? (
                      <Text variant="note" tone="danger" role="alert">
                        {nameError}
                      </Text>
                    ) : null}
                    <Stack direction="row" justify="end">
                      <Button type="submit" loading={issuing}>
                        発行する
                      </Button>
                    </Stack>
                  </Stack>
                </form>
                {issued ? (
                  <Stack gap="1">
                    <Text as="output" variant="code">
                      {issued.code}
                    </Text>
                    <Text variant="note" tone="muted">
                      {formatDateTime(issued.expiresAt)}まで、1回だけ使えます
                    </Text>
                  </Stack>
                ) : null}
              </Stack>
            </Surface>
            {workers.length === 0 ? (
              <EmptyState title="採点ワーカーはまだ登録されていません" />
            ) : (
              <DataTable
                caption="採点ワーカー"
                overflow="scroll"
                columns={["名前", "登録日時", "最後のheartbeat", "ComfyUI", "GPU", "状態", "操作"]}
              >
                {workers.map((worker) => (
                  <DataRow key={worker.id}>
                    <DataCell header kind="strong">
                      {worker.name}
                    </DataCell>
                    <DataCell>{formatDateTime(worker.createdAt)}</DataCell>
                    <DataCell>{formatDateTime(worker.lastSeenAt)}</DataCell>
                    <DataCell>{worker.status?.comfyStatus ?? "—"}</DataCell>
                    <DataCell>{gpuText(worker.status)}</DataCell>
                    <DataCell>
                      {worker.revokedAt === null ? (
                        <Badge tone="success" size="sm">
                          有効
                        </Badge>
                      ) : (
                        <Text as="span" variant="caption" tone="muted">
                          失効（{formatDateTime(worker.revokedAt)}）
                        </Text>
                      )}
                    </DataCell>
                    <DataCell kind="actions">
                      {worker.revokedAt === null ? (
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => {
                            setRevoking(worker);
                            setRevokeError(null);
                            setConfirmOpen(true);
                          }}
                        >
                          失効させる
                        </Button>
                      ) : null}
                    </DataCell>
                  </DataRow>
                ))}
              </DataTable>
            )}
          </Stack>
        }
        secondary={<AdminGuide items={guideItems} />}
      />
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="採点ワーカーを失効させますか？"
        description={`「${revoking?.name ?? ""}」からの要求を以後すべて拒否します。`}
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button variant="destructive" loading={revokingBusy} onClick={() => void revoke()}>
              失効させる
            </Button>
          </>
        }
      >
        {revokeError ? (
          <Text variant="note" tone="danger" role="alert">
            {revokeError}
          </Text>
        ) : null}
      </Dialog>
    </>
  );
}
