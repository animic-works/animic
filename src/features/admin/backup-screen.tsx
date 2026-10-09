import { Split } from "@animic/react/split";
import { useRef, useState } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { DataTable } from "@animic/react/data-table";
import { Dialog } from "@animic/react/dialog";
import { FileButton } from "@animic/react/file-button";
import { Heading } from "@animic/react/heading";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { AdminGuide, AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";
import { applyBackupFile, createBackupFile, openBackupFile } from "./backup-transfer";
import type { OpenedBackup } from "./backup-transfer";
import { downloadBlob } from "./download";

type Progress = { done: number; total: number };

export function BackupScreen() {
  const toast = useToast();
  const operation = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<Progress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [opened, setOpened] = useState<OpenedBackup | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<Progress | null>(null);
  const busy = exporting || importing || reading;

  async function exportBackup() {
    if (operation.current) return;
    operation.current = true;
    setExportError(null);
    setExportProgress(null);
    setExporting(true);
    try {
      const { fileName: name, blob } = await createBackupFile((done, total) =>
        setExportProgress({ done, total }),
      );
      downloadBlob(name, blob);
      toast.show({ title: "書き出しました" });
    } catch (caught) {
      setExportError(errorMessage(caught));
    } finally {
      setExporting(false);
      setExportProgress(null);
      operation.current = false;
    }
  }

  async function chooseFile(file: File) {
    if (operation.current) return;
    operation.current = true;
    setFileName(file.name);
    setOpened(null);
    setOpenError(null);
    setFailed(false);
    setReading(true);
    try {
      const result = await openBackupFile(file);
      if (result.opened) setOpened(result.opened);
      else setOpenError(result.error);
    } catch (caught) {
      setOpenError(errorMessage(caught));
    } finally {
      setReading(false);
      operation.current = false;
    }
  }

  async function applyImport() {
    if (!opened || operation.current) return;
    operation.current = true;
    setImporting(true);
    setImportProgress(null);
    setOpenError(null);
    setFailed(false);
    try {
      await applyBackupFile(opened, (done, total) => setImportProgress({ done, total }));
      setConfirmOpen(false);
      toast.show({ title: "読み込みました" });
      setFileName(null);
      setOpened(null);
    } catch (caught) {
      setConfirmOpen(false);
      setOpenError(errorMessage(caught));
      setFailed(true);
    } finally {
      setImporting(false);
      setImportProgress(null);
      operation.current = false;
    }
  }

  const summary = opened?.summary;
  return (
    <Stack space="section">
      <AdminHead
        eyebrow="Admin"
        title="バックアップ"
        description="お題（画像を含む）・対戦条件・よく使う表現を1つのZIPで書き出し、読み込みます。"
      />
      <Split layout="main-aside">
        <Stack>
          <Surface appearance="subtle" padding="lg">
            <Stack>
              <Heading level={2} size="sm">
                書き出し
              </Heading>
              <Cluster>
                <Button
                  loading={exporting || importing || reading}

                  onClick={() => void exportBackup()}
                >
                  書き出す
                </Button>
              </Cluster>
              {exporting && exportProgress && (
                <div role="status">
                  <Text variant="body.sm">
                    画像を読み込んでいます（{exportProgress.done}/{exportProgress.total}）
                  </Text>
                </div>
              )}
              {exportError && (
                <div role="alert">
                  <Text tone="danger">{exportError}</Text>
                </div>
              )}
            </Stack>
          </Surface>
          <Surface appearance="subtle" padding="lg">
            <Stack>
              <Heading level={2} size="sm">
                読み込み
              </Heading>
              <Cluster>
                <FileButton
                  label="バックアップのZIP"
                  accept=".zip,application/zip"
                  loading={busy}
                  onFile={(file) => void chooseFile(file)}
                />
              </Cluster>
              {fileName && <Text variant="body.sm">{fileName}</Text>}
              {reading && (
                <div role="status">
                  <Text>ZIPの内容を確認しています…</Text>
                </div>
              )}
              {openError && (
                <Stack space="compact">
                  <div role="alert">
                    <Text tone="danger">{openError}</Text>
                  </div>
                  {failed && (
                    <Text variant="body.sm" tone="muted">
                      同じZIPをもう一度読み込むと、続きから同じ状態にできます。
                    </Text>
                  )}
                </Stack>
              )}
              {summary && (
                <Stack>
                  <DataTable
                    label="読み込む内容"
                    getRowKey={(row) => row.label}
                    empty="読み込む内容はありません。"
                    rows={[
                      { label: "お題", ...summary.topics },
                      { label: "グループ", ...summary.promptGroups },
                      { label: "表現", ...summary.promptPhrases },
                    ]}
                    columns={[
                      { id: "kind", header: "種類", rowHeader: true, cell: (row) => row.label },
                      { id: "added", header: "追加", cell: (row) => row.added },
                      { id: "updated", header: "上書き", cell: (row) => row.updated },
                    ]}
                  />
                  <Text variant="body.sm" tone="muted">
                    対戦条件は、ZIPの内容に置き換えます。ZIPにないものは削除しません。
                  </Text>
                  <Cluster>
                    <Button loading={busy} onClick={() => setConfirmOpen(true)}>
                      読み込む
                    </Button>
                  </Cluster>
                </Stack>
              )}
            </Stack>
          </Surface>
        </Stack>
        <AdminGuide
          items={[
            { term: "含まれるもの", body: "お題と画像、対戦条件の候補、よく使う表現。" },
            {
              term: "含まれないもの",
              body: "採点ワーカー・採点ジョブ・対戦結果・参加者の情報・生成した画像・画像生成のモデル。",
            },
            {
              term: "読み込み",
              body: "同じIDのものは上書きし、ないものは追加します。ZIPにないものは削除しません。",
            },
          ]}
        />
      </Split>
      <Dialog
        size="compact"
        presentation="centered"
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!importing) setConfirmOpen(open);
        }}
        dismissible={!importing}
        closeButton={!importing}
        title="読み込みますか？"
        description="同じIDのお題・グループ・表現を上書きします。"
        footer={
          <Cluster justify="end">
            <Button
              appearance="secondary"
              loading={importing}
              onClick={() => setConfirmOpen(false)}
            >
              やめる
            </Button>
            <Button loading={importing} onClick={() => void applyImport()}>
              読み込む
            </Button>
          </Cluster>
        }
      >
        {importProgress && (
          <div role="status">
            <Text variant="body.sm">
              読み込んでいます（{importProgress.done}/{importProgress.total}）
            </Text>
          </div>
        )}
      </Dialog>
    </Stack>
  );
}
