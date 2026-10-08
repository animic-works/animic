import { useState } from "react";
import * as v from "valibot";

import { Button } from "../../components/button";
import { Dialog, DialogClose } from "../../components/dialog";
import { TextArea, TextField } from "../../components/field";
import { FileField } from "../../components/file-upload";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { SegmentedControl } from "../../components/segmented-control";
import { Surface } from "../../components/surface";
import { Heading, Text } from "../../components/text";
import { toast } from "../../components/toast";
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
import { AdminColumns, AdminHead, InfoList } from "./admin-parts";
import { DIFFICULTY_OPTIONS, DifficultyBadge, StatusBadge, difficultyOf } from "./topic-labels";
import type { Difficulty } from "./topic-labels";
import styles from "./topic-detail-screen.module.css";

type AdminTopicRow = NonNullable<Awaited<ReturnType<typeof getAdminTopic>>>;

export type TopicDetailScreenProps = {
  topic: AdminTopicRow;
  onBack: () => void;
  onChanged: () => Promise<void>;
  onDeleted: () => void;
};

// お題の詳細: 画像・題名や難易度の編集・公開の切り替え・画像の差し替え・削除
export function TopicDetailScreen({ topic, onBack, onChanged, onDeleted }: TopicDetailScreenProps) {
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
      toast("保存しました");
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
        toast(result.error);
        return;
      }
      toast(published ? "非公開にしました" : "公開しました");
      await onChanged();
    } catch (caught) {
      toast(errorMessage(caught));
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
      toast("画像を差し替えました");
      await onChanged();
    } catch (caught) {
      setReplaceError(errorMessage(caught));
    } finally {
      setReplacing(false);
    }
  }

  async function remove() {
    try {
      await deleteTopic({ data: { id: topic.id } });
      setConfirmDelete(false);
      toast("削除しました");
      onDeleted();
    } catch (caught) {
      toast(errorMessage(caught));
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
          published ? (
            <Button variant="secondary" loading={statusBusy} onClick={() => void changeStatus()}>
              非公開にする
            </Button>
          ) : (
            <Button loading={statusBusy} onClick={() => void changeStatus()}>
              公開する
            </Button>
          )
        }
      />
      <AdminColumns
        layout="detail"
        primary={<img className={styles.image} src={topic.imageUrl} alt="お題の画像" />}
        secondary={
          <>
            <Surface as="section" variant="soft" padding="lg" aria-labelledby="topic-edit-title">
              <Stack gap="5">
                <Heading id="topic-edit-title" variant="heading-sm">
                  お題の情報
                </Heading>
                <TextField
                  label="題名"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={60}
                  helperText="任意・60文字まで"
                />
                <Stack gap="2">
                  <Text variant="label" as="p" aria-hidden="true">
                    難易度
                  </Text>
                  <Stack direction="row">
                    <SegmentedControl
                      label="難易度"
                      tone="accent"
                      options={DIFFICULTY_OPTIONS}
                      value={difficulty}
                      onValueChange={(value) => setDifficulty(difficultyOf(value))}
                    />
                  </Stack>
                </Stack>
                <TextArea
                  label="備考"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={1000}
                  helperText="任意・1000文字まで（出典・権利のメモ）"
                />
                {error ? (
                  <Text variant="note" tone="danger" role="alert">
                    {error}
                  </Text>
                ) : null}
                <Stack direction="row" justify="end">
                  <Button
                    variant="secondary"
                    leadingIcon={<Icon name="check" size="sm" />}
                    loading={saving}
                    loadingText="保存しています…"
                    onClick={() => void save()}
                  >
                    保存する
                  </Button>
                </Stack>
              </Stack>
            </Surface>
            <Surface as="section" variant="soft" padding="lg" aria-labelledby="topic-image-title">
              <Stack gap="3">
                <Heading id="topic-image-title" variant="heading-sm">
                  画像
                </Heading>
                <Stack direction="row">
                  <Button
                    variant="secondary"
                    leadingIcon={<Icon name="image" size="sm" />}
                    onClick={() => setReplaceOpen(true)}
                  >
                    画像を差し替える
                  </Button>
                </Stack>
              </Stack>
            </Surface>
            <Surface as="section" variant="soft" padding="lg" aria-labelledby="topic-info-title">
              <Stack gap="3">
                <Heading id="topic-info-title" variant="heading-sm">
                  情報
                </Heading>
                <InfoList
                  rows={[
                    { term: "ID", value: topic.id, code: true },
                    { term: "作成日時", value: formatDateTime(topic.createdAt || null) },
                    { term: "更新日時", value: formatDateTime(topic.updatedAt || null) },
                    { term: "画像のURL", value: topic.imageUrl, code: true },
                  ]}
                />
              </Stack>
            </Surface>
            <Surface as="section" variant="soft" padding="lg" aria-labelledby="topic-delete-title">
              <Stack gap="3">
                <Heading id="topic-delete-title" variant="heading-sm">
                  お題の削除
                </Heading>
                <Stack direction="row">
                  <Button
                    variant="destructive"
                    leadingIcon={<Icon name="trash" size="sm" />}
                    onClick={() => setConfirmDelete(true)}
                  >
                    お題を削除
                  </Button>
                </Stack>
              </Stack>
            </Surface>
          </>
        }
      />
      <Dialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        title="画像を差し替える"
        description="新しい画像は新しいURLで配信します。過去の対戦結果は元の画像のままです。"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button
              loading={replacing}
              loadingText="差し替えています…"
              disabled={!replaceFiles.length}
              onClick={() => void replace()}
            >
              差し替える
            </Button>
          </>
        }
      >
        <Stack gap="3">
          <FileField
            label="新しい画像"
            accept={topicSourceImageTypes.join(",")}
            files={replaceFiles}
            onFilesChange={setReplaceFiles}
            preview
          />
          {replaceError ? (
            <Text variant="note" tone="danger" role="alert">
              {replaceError}
            </Text>
          ) : null}
        </Stack>
      </Dialog>
      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        role="alertdialog"
        title="お題を削除しますか？"
        description="進行中の対戦と保存済みの結果は変わりません。画像は過去の結果のために残します。"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => void remove()}>
              削除する
            </Button>
          </>
        }
      />
    </>
  );
}
