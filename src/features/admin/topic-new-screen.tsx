import { useState } from "react";
import { Button } from "@animic/react/button";
import { DataTable, type DataTableColumn } from "@animic/react/data-table";
import { FileButton } from "@animic/react/file-button";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { errorMessage } from "./admin-format";
import { AdminGuide, AdminHead, AdminError } from "./admin-parts";
import { DIFFICULTY_OPTIONS, difficultyOf, type Difficulty } from "./topic-labels";
import { toTopicWebp } from "../battle/topic-image-file";
import { topicSourceImageTypes } from "../battle/topic-admin";
import { Badge } from "@animic/react/badge";
import { ActionGroup } from "@animic/react/action-group";
import { createTopic } from "../battle/topic-admin.functions";
type ResultRow = {
  id: string;
  name: string;
  state: "waiting" | "running" | "done" | "failed";
  result: string;
};
const labels = { waiting: "待機", running: "追加中", done: "完了", failed: "失敗" };
export type TopicNewScreenProps = { onOpen: (id: string) => void; onBack: () => void };
function resultColumns(onOpen: (id: string) => void): DataTableColumn<ResultRow>[] {
  return [
    {
      id: "name",
      header: "ファイル名",
      rowHeader: true,
      cell: (row) => <Text variant="code.compact">{row.name}</Text>,
    },
    {
      id: "state",
      header: "状態",
      cell: (row) => (
        <Badge
          tone={row.state === "done" ? "success" : row.state === "failed" ? "danger" : "neutral"}
        >
          {labels[row.state]}
        </Badge>
      ),
    },
    {
      id: "result",
      header: "結果",
      cell: (row) => <Text tone={row.state === "failed" ? "danger" : "default"}>{row.result}</Text>,
    },
    {
      id: "open",
      header: "開く",
      cell: (row) =>
        row.state === "done" ? (
          <Button
            size="xs"
            appearance="secondary"
            onClick={() => onOpen(row.id)}
            aria-label={`${row.name}を開く`}
          >
            開く
          </Button>
        ) : null,
    },
  ];
}

export function TopicNewScreen({ onOpen, onBack }: TopicNewScreenProps) {
  const toast = useToast();
  const [fileError, setFileError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!files.length) {
      toast.show({ title: "追加する画像を選んでください" });
      return;
    }
    // ファイルごとにIDを決め、1件ずつ順に送る（失敗しても続ける）
    const queue = files.map((file) => ({ file, id: crypto.randomUUID() }));
    setRows(queue.map(({ file, id }) => ({ id, name: file.name, state: "waiting", result: "" })));
    setBusy(true);
    const patch = (id: string, next: Partial<ResultRow>) =>
      setRows((current) => current.map((row) => (row.id === id ? { ...row, ...next } : row)));
    let added = 0;
    for (const { file, id } of queue) {
      patch(id, { state: "running" });
      try {
        const blob = await toTopicWebp(file);
        const form = new FormData();
        form.set("id", id);
        form.set("difficulty", difficulty);
        form.set("file", new File([blob], "topic.webp", { type: "image/webp" }));
        const result = await createTopic({ data: form });
        if (result.error !== null) {
          patch(id, { state: "failed", result: result.error });
          continue;
        }
        added += 1;
        patch(id, { state: "done", result: "非公開で追加しました" });
      } catch (caught) {
        patch(id, { state: "failed", result: errorMessage(caught) });
      }
    }
    setBusy(false);
    setFiles([]);
    toast.show({ title: `${added}件を追加しました` });
  }

  return (
    <Stack space="section">
      <AdminHead
        eyebrow="Admin"
        title="お題を追加"
        crumbs={[{ label: "お題", href: "/admin/topics" }, { label: "お題を追加" }]}
        onCrumbClick={(_href, event) => {
          event.preventDefault();
          onBack();
        }}
      />
      <Split layout="main-aside" align="start">
        <Surface appearance="card">
          <Stack>
            <FileButton
              label="画像"
              accept={topicSourceImageTypes.join(",")}
              multiple
              loading={busy}
              onFiles={(next) => {
                if (next.length > 20) {
                  setFileError("画像は20件まで選べます。");
                  return;
                }
                setFileError(null);
                setFiles(next);
              }}
            />
            <Text variant="caption">
              PNG・WebP・JPEG（10MB以下）・20件まで。メタデータを消したWebPに変換して保存します
            </Text>
            <AdminError>{fileError}</AdminError>
            {files.map((file, index) => (
              <ActionGroup key={`${file.name}-${index}`}>
                <Text variant="code.compact">{file.name}</Text>
                <Button
                  size="xs"
                  appearance="quiet"
                  loading={busy}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  aria-label={`${file.name}を外す`}
                >
                  外す
                </Button>
              </ActionGroup>
            ))}
            <SegmentedControl
              label="難易度（全ファイルに適用）"
              labelVisibility="visible"
              tone="accent"
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              disabled={busy}
              onValueChange={(value) => setDifficulty(difficultyOf(value))}
            />
            <Button size="lg" loading={busy} onClick={() => void submit()}>
              追加する
            </Button>
            {rows.length > 0 && (
              <DataTable
                label="追加の結果"
                rows={rows}
                getRowKey={(row) => row.id}
                empty="追加した画像はありません"
                columns={resultColumns(onOpen)}
              />
            )}
          </Stack>
        </Surface>
        <AdminGuide
          items={[
            {
              term: "状態",
              body: "追加したお題は非公開で登録されます。公開するまで出題されません。",
            },
            {
              term: "画像",
              body: "ブラウザーでWebPに変換し、メタデータと透過を消してから保存します。NovelAIの画像に残ったプロンプトも消えます。",
            },
            {
              term: "複数のファイル",
              body: "1件ずつ順に追加します。失敗したファイルがあっても、ほかは追加します。",
            },
          ]}
        />
      </Split>
    </Stack>
  );
}
