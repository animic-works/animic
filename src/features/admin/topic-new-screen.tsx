import { useState } from "react";
import type { ReactNode } from "react";

import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { DataCell, DataCode, DataRow, DataTable } from "../../components/data-table";
import { FileField } from "../../components/file-upload";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { SegmentedControl } from "../../components/segmented-control";
import { Surface } from "../../components/surface";
import { Text } from "../../components/text";
import { toast } from "../../components/toast";
import { createTopic } from "../battle/topic-admin.functions";
import { topicSourceImageTypes } from "../battle/topic-admin";
import { toTopicWebp } from "../battle/topic-image-file";
import { errorMessage } from "./admin-format";
import { AdminColumns, AdminGuide, AdminHead } from "./admin-parts";
import { DIFFICULTY_OPTIONS, difficultyOf } from "./topic-labels";
import type { Difficulty } from "./topic-labels";

const MAX_FILES = 20;

type ResultState = "waiting" | "running" | "done" | "failed";

type ResultRow = {
  /** お題のID（ファイルごとに1つ発行する） */
  id: string;
  name: string;
  state: ResultState;
  result: string;
};

const STATE_BADGES: Record<ResultState, ReactNode> = {
  waiting: (
    <Badge variant="outline" size="sm">
      待機
    </Badge>
  ),
  running: (
    <Badge tone="info" size="sm">
      追加中
    </Badge>
  ),
  done: (
    <Badge tone="success" variant="solid" size="sm">
      完了
    </Badge>
  ),
  failed: (
    <Badge tone="danger" size="sm">
      失敗
    </Badge>
  ),
};

export type TopicNewScreenProps = {
  onOpen: (topicId: string) => void;
  onBack: () => void;
};

// お題の追加: 画像を選び、ブラウザーでWebPに変換して非公開のお題を作る
export function TopicNewScreen({ onOpen, onBack }: TopicNewScreenProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!files.length) {
      toast("追加する画像を選んでください");
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
    toast(`${added}件を追加しました`);
  }

  return (
    <>
      <AdminHead
        crumbs={[{ label: "お題", href: "/admin/topics" }, { label: "お題を追加" }]}
        onCrumbClick={(_href, event) => {
          event.preventDefault();
          onBack();
        }}
        eyebrow="Admin"
        title="お題を追加"
      />
      <AdminColumns
        layout="form"
        primary={
          <Surface variant="soft" padding="lg">
            <Stack gap="5">
              <FileField
                label="画像"
                dropText="画像をここにドロップ"
                multiple
                maxFiles={MAX_FILES}
                accept={topicSourceImageTypes.join(",")}
                helperText="PNG・WebP・JPEG（10MB以下）・20件まで。メタデータを消したWebPに変換して保存します"
                files={files}
                onFilesChange={setFiles}
                disabled={busy}
              />
              <Stack gap="2">
                <Text variant="label" as="p" aria-hidden="true">
                  難易度（全ファイルに適用）
                </Text>
                <Stack direction="row">
                  <SegmentedControl
                    label="難易度（全ファイルに適用）"
                    tone="accent"
                    options={DIFFICULTY_OPTIONS}
                    value={difficulty}
                    disabled={busy}
                    onValueChange={(value) => setDifficulty(difficultyOf(value))}
                  />
                </Stack>
              </Stack>
              <Stack direction="row" justify="end">
                <Button
                  size="lg"
                  leadingIcon={<Icon name="upload" size="lg" />}
                  loading={busy}
                  loadingText="追加しています…"
                  onClick={() => void submit()}
                >
                  追加する
                </Button>
              </Stack>
              {rows.length ? (
                <DataTable caption="追加の結果" columns={["ファイル名", "状態", "結果", "開く"]}>
                  {rows.map((row) => (
                    <DataRow key={row.id}>
                      <DataCell header>
                        <DataCode>{row.name}</DataCode>
                      </DataCell>
                      <DataCell>{STATE_BADGES[row.state]}</DataCell>
                      <DataCell>
                        <Text
                          variant="body-sm"
                          tone={row.state === "failed" ? "danger" : "default"}
                          as="span"
                        >
                          {row.result}
                        </Text>
                      </DataCell>
                      <DataCell kind="actions">
                        {row.state === "done" ? (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => onOpen(row.id)}
                            aria-label={`${row.name}を開く`}
                          >
                            開く
                          </Button>
                        ) : null}
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
              ) : null}
            </Stack>
          </Surface>
        }
        secondary={
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
        }
      />
    </>
  );
}
