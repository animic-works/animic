import { useState } from "react";
import * as v from "valibot";
import { ActionGroup } from "@animic/react/action-group";
import { Button } from "@animic/react/button";
import { DataTable } from "@animic/react/data-table";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { FileButton } from "@animic/react/file-button";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { Media } from "@animic/react/media";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { Textarea } from "@animic/react/textarea";
import { useToast } from "@animic/react/toast";
import { topicNoteSchema, topicSourceImageTypes, topicTitleSchema } from "../battle/topic-admin";
import {
  deleteTopic,
  getAdminTopic,
  replaceTopicImage,
  setTopicStatus,
  updateTopic,
} from "../battle/topic-admin.functions";
import { toTopicWebp } from "../battle/topic-image-file";
import { errorMessage, formatDateTime } from "./admin-format";
import { AdminError, AdminHead } from "./admin-parts";
import { DIFFICULTY_OPTIONS, DifficultyBadge, StatusBadge, difficultyOf } from "./topic-labels";
import type { Difficulty } from "./topic-labels";

type AdminTopicRow = NonNullable<Awaited<ReturnType<typeof getAdminTopic>>>;

export type TopicDetailScreenProps = {
  topic: AdminTopicRow;
  onBack: () => void;
  onChanged: () => Promise<void>;
  onDeleted: () => void;
};

// お題の詳細: 画像・題名や難易度の編集・公開の切り替え・画像の差し替え・削除
export function TopicDetailScreen({ topic, onBack, onChanged, onDeleted }: TopicDetailScreenProps) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [note, setNote] = useState(topic.note);
  const [difficulty, setDifficulty] = useState<Difficulty>(topic.difficulty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceFiles, setReplaceFiles] = useState<File[]>([]);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const name = topic.title || topic.id;
  const published = topic.status === "published";

  async function save() {
    const titleResult = v.safeParse(topicTitleSchema, title);
    if (!titleResult.success) {
      setError(titleResult.issues[0].message);
      return;
    }
    const noteResult = v.safeParse(topicNoteSchema, note);
    if (!noteResult.success) {
      setError(noteResult.issues[0].message);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await updateTopic({
        data: { id: topic.id, difficulty, title: titleResult.output, note: noteResult.output },
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.show({ title: "保存しました" });
      await onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus() {
    setStatusBusy(true);
    try {
      const result = await setTopicStatus({
        data: { id: topic.id, status: published ? "unpublished" : "published" },
      });
      if (result.error) {
        toast.show({ title: result.error });
        return;
      }
      toast.show({ title: published ? "非公開にしました" : "公開しました" });
      await onChanged();
    } catch (caught) {
      toast.show({ title: errorMessage(caught) });
    } finally {
      setStatusBusy(false);
    }
  }

  async function replace() {
    const [file] = replaceFiles;
    if (!file) return;
    setReplacing(true);
    try {
      const blob = await toTopicWebp(file);
      const form = new FormData();
      form.set("id", topic.id);
      form.set("file", new File([blob], "topic.webp", { type: "image/webp" }));
      const result = await replaceTopicImage({ data: form });
      if (result.error) {
        setReplaceError(result.error);
        return;
      }
      setReplaceError(null);
      setReplaceOpen(false);
      setReplaceFiles([]);
      toast.show({ title: "画像を差し替えました" });
      await onChanged();
    } catch (caught) {
      setReplaceError(errorMessage(caught));
    } finally {
      setReplacing(false);
    }
  }

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteTopic({ data: { id: topic.id } });
      setConfirmDelete(false);
      toast.show({ title: "削除しました" });
      onDeleted();
    } catch (caught) {
      toast.show({ title: errorMessage(caught) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminHead
        crumbs={[{ label: "お題", href: "/admin/topics" }, { label: name }]}
        onCrumbClick={(_href, event) => {
          event.preventDefault();
          onBack();
        }}
        eyebrow="Admin"
        title={name}
        titleAside={
          <>
            <StatusBadge status={topic.status} />
            <DifficultyBadge difficulty={topic.difficulty} />
          </>
        }
        actions={
          <Button
            appearance={published ? "secondary" : "primary"}
            loading={statusBusy}
            onClick={() => void changeStatus()}
          >
            {published ? "非公開にする" : "公開する"}
          </Button>
        }
      />
      <Split layout="balanced" align="start">
        <Media src={topic.imageUrl} alt="お題の画像" aspect="portrait" fit="contain" />
        <Stack>
          <section aria-labelledby="topic-edit-title">
            <Surface appearance="subtle">
              <Stack>
                <Heading level={2} id="topic-edit-title" size="sm">
                  お題の情報
                </Heading>
                <Field label="題名" description="任意・60文字まで">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={60}
                  />
                </Field>
                <SegmentedControl
                  label="難易度"
                  labelVisibility="visible"
                  options={DIFFICULTY_OPTIONS}
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(difficultyOf(value))}
                />
                <Field label="備考" description="任意・1000文字まで（出典・権利のメモ）">
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                  />
                </Field>
                <AdminError>{error}</AdminError>
                <ActionGroup>
                  <Button appearance="secondary" loading={saving} onClick={() => void save()}>
                    保存する
                  </Button>
                </ActionGroup>
              </Stack>
            </Surface>
          </section>
          <section aria-labelledby="topic-image-title">
            <Surface appearance="subtle">
              <Stack>
                <Heading level={2} id="topic-image-title" size="sm">
                  画像
                </Heading>
                <ActionGroup>
                  <Button appearance="secondary" onClick={() => setReplaceOpen(true)}>
                    画像を差し替える
                  </Button>
                </ActionGroup>
              </Stack>
            </Surface>
          </section>
          <section aria-labelledby="topic-info-title">
            <Surface appearance="subtle">
              <Stack>
                <Heading level={2} id="topic-info-title" size="sm">
                  情報
                </Heading>
                <DataTable
                  label="お題の情報"
                  empty="情報がありません"
                  rows={[
                    { term: "ID", value: topic.id },
                    { term: "作成日時", value: formatDateTime(topic.createdAt || null) },
                    { term: "更新日時", value: formatDateTime(topic.updatedAt || null) },
                    { term: "画像のURL", value: topic.imageUrl },
                  ]}
                  getRowKey={(row) => row.term}
                  columns={[
                    { id: "term", header: "項目", rowHeader: true, cell: (row) => row.term },
                    { id: "value", header: "内容", cell: (row) => row.value },
                  ]}
                />
              </Stack>
            </Surface>
          </section>
          <section aria-labelledby="topic-delete-title">
            <Surface appearance="subtle">
              <Stack>
                <Heading level={2} id="topic-delete-title" size="sm">
                  お題の削除
                </Heading>
                <ActionGroup>
                  <Button appearance="outlined" onClick={() => setConfirmDelete(true)}>
                    お題を削除
                  </Button>
                </ActionGroup>
              </Stack>
            </Surface>
          </section>
        </Stack>
      </Split>
      <Dialog
        open={replaceOpen}
        onOpenChange={(open) => {
          if (!replacing) setReplaceOpen(open);
        }}
        title="画像を差し替える"
        description="新しい画像は新しいURLで配信します。過去の対戦結果は元の画像のままです。"
        size="compact"
        presentation="centered"
        footer={
          <ActionGroup>
            <Button
              appearance="secondary"
              loading={replacing}
              onClick={() => setReplaceOpen(false)}
            >
              やめる
            </Button>
            <Button
              loading={replacing}
              disabled={!replaceFiles.length}
              onClick={() => void replace()}
            >
              差し替える
            </Button>
          </ActionGroup>
        }
      >
        <Stack>
          <FileButton
            label="新しい画像"
            accept={topicSourceImageTypes.join(",")}
            loading={replacing}
            onFile={(file) => {
              setReplaceError(null);
              setReplaceFiles([file]);
            }}
          />
          {replaceFiles[0] && <Text>{replaceFiles[0].name}</Text>}
          <AdminError>{replaceError}</AdminError>
        </Stack>
      </Dialog>
      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!deleting) setConfirmDelete(open);
        }}
        title="お題を削除しますか？"
        description="進行中の対戦と保存済みの結果は変わりません。画像は過去の結果のために残します。"
        size="compact"
        presentation="centered"
        footer={
          <ActionGroup>
            <Button
              appearance="secondary"
              loading={deleting}
              onClick={() => setConfirmDelete(false)}
            >
              やめる
            </Button>
            <Button loading={deleting} onClick={() => void remove()}>
              削除する
            </Button>
          </ActionGroup>
        }
      >
        {null}
      </Dialog>
    </>
  );
}
