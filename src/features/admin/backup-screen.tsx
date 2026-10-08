import { useState } from "react";

import { Button } from "../../components/button";
import { DataCell, DataRow, DataTable } from "../../components/data-table";
import { Dialog, DialogClose } from "../../components/dialog";
import { FileField } from "../../components/file-upload";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { Surface } from "../../components/surface";
import { Heading, Text } from "../../components/text";
import { toast } from "../../components/toast";
import { AdminColumns, AdminGuide, AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";
import { applyBackupFile, createBackupFile, openBackupFile } from "./backup-transfer";
import type { OpenedBackup } from "./backup-transfer";
import { downloadBlob } from "./download";

type Progress = { done: number; total: number };

// バックアップ: お題・対戦条件・よく使う表現を1つのZIPで書き出し、読み込む
export function BackupScreen() {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<Progress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [opened, setOpened] = useState<OpenedBackup | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<Progress | null>(null);

  async function exportBackup() {
    setExportError(null);
    setExportProgress(null);
    setExporting(true);
    try {
      const { fileName, blob } = await createBackupFile((done, total) =>
        setExportProgress({ done, total }),
      );
      downloadBlob(fileName, blob);
      toast("書き出しました");
    } catch (caught) {
      setExportError(errorMessage(caught));
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }

  // ZIPを選んだら開いて確かめ、読み込む内容の件数を出す。まだ何も書き込まない。
  async function chooseFile(next: File[]) {
    setFiles(next);
    setOpened(null);
    setOpenError(null);
    setFailed(false);
    const [file] = next;
    if (!file) return;
    try {
      const result = await openBackupFile(file);
      if (result.opened) setOpened(result.opened);
      else setOpenError(result.error);
    } catch (caught) {
      setOpenError(errorMessage(caught));
    }
  }

  async function applyImport() {
    if (!opened) return;
    setImporting(true);
    setImportProgress(null);
    setOpenError(null);
    setFailed(false);
    try {
      await applyBackupFile(opened, (done, total) => setImportProgress({ done, total }));
      setConfirmOpen(false);
      toast("読み込みました");
      setFiles([]);
      setOpened(null);
    } catch (caught) {
      setConfirmOpen(false);
      setOpenError(errorMessage(caught));
      setFailed(true);
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  const summary = opened?.summary;

  return (
    <>
      <AdminHead
        eyebrow="Admin"
        title="バックアップ"
        description="お題（画像を含む）・対戦条件・よく使う表現を1つのZIPで書き出し、読み込みます。"
      />
      <AdminColumns
        layout="form"
        primary={
          <Stack gap="4">
            <Surface as="section" variant="soft" padding="lg">
              <Stack gap="3">
                <Heading variant="heading-sm">書き出し</Heading>
                <Stack direction="row">
                  <Button
                    leadingIcon={<Icon name="download" size="sm" />}
                    loading={exporting}
                    onClick={() => void exportBackup()}
                  >
                    書き出す
                  </Button>
                </Stack>
                {exporting && exportProgress ? (
                  <Text variant="note" role="status">
                    画像を読み込んでいます（{exportProgress.done}/{exportProgress.total}）
                  </Text>
                ) : null}
                {exportError ? (
                  <Text variant="note" tone="danger" role="alert">
                    {exportError}
                  </Text>
                ) : null}
              </Stack>
            </Surface>
            <Surface as="section" variant="soft" padding="lg">
              <Stack gap="3">
                <Heading variant="heading-sm">読み込み</Heading>
                <FileField
                  label="バックアップのZIP"
                  dropText="ZIPをここにドロップ"
                  accept=".zip,application/zip"
                  files={files}
                  onFilesChange={(next) => void chooseFile(next)}
                />
                {openError ? (
                  <Stack gap="1">
                    <Text variant="note" tone="danger" role="alert">
                      {openError}
                    </Text>
                    {failed ? (
                      <Text variant="note" tone="muted">
                        同じZIPをもう一度読み込むと、続きから同じ状態にできます。
                      </Text>
                    ) : null}
                  </Stack>
                ) : null}
                {summary ? (
                  <Stack gap="3">
                    <DataTable caption="読み込む内容" columns={["種類", "追加", "上書き"]}>
                      <DataRow>
                        <DataCell header kind="strong">
                          お題
                        </DataCell>
                        <DataCell kind="number">{summary.topics.added}</DataCell>
                        <DataCell kind="number">{summary.topics.updated}</DataCell>
                      </DataRow>
                      <DataRow>
                        <DataCell header kind="strong">
                          グループ
                        </DataCell>
                        <DataCell kind="number">{summary.promptGroups.added}</DataCell>
                        <DataCell kind="number">{summary.promptGroups.updated}</DataCell>
                      </DataRow>
                      <DataRow>
                        <DataCell header kind="strong">
                          表現
                        </DataCell>
                        <DataCell kind="number">{summary.promptPhrases.added}</DataCell>
                        <DataCell kind="number">{summary.promptPhrases.updated}</DataCell>
                      </DataRow>
                    </DataTable>
                    <Text variant="note" tone="muted">
                      対戦条件は、ZIPの内容に置き換えます。ZIPにないものは削除しません。
                    </Text>
                    <Stack direction="row">
                      <Button
                        leadingIcon={<Icon name="upload" size="sm" />}
                        onClick={() => setConfirmOpen(true)}
                      >
                        読み込む
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            </Surface>
          </Stack>
        }
        secondary={
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
        }
      />
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!importing) setConfirmOpen(open);
        }}
        role="alertdialog"
        title="読み込みますか？"
        description="同じIDのお題・グループ・表現を上書きします。"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button loading={importing} onClick={() => void applyImport()}>
              読み込む
            </Button>
          </>
        }
      >
        {importProgress ? (
          <Text variant="note" role="status">
            読み込んでいます（{importProgress.done}/{importProgress.total}）
          </Text>
        ) : null}
      </Dialog>
    </>
  );
}
