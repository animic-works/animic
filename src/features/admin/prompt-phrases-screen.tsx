import { useState } from "react";
import * as v from "valibot";

import { Button } from "../../components/button";
import { DataCell, DataCode, DataRow, DataTable } from "../../components/data-table";
import { Dialog, DialogClose } from "../../components/dialog";
import { EmptyState } from "../../components/empty-state";
import { TextField } from "../../components/field";
import { Icon, IconButton } from "../../components/icon";
import { Stack } from "../../components/layout";
import { Text } from "../../components/text";
import { toast } from "../../components/toast";
import {
  deletePromptGroup,
  deletePromptPhrase,
  movePromptGroup,
  movePromptPhrase,
  savePromptGroup,
  savePromptPhrase,
} from "../image-generation/prompt-phrases.functions";
import {
  promptGroupLabelSchema,
  promptPhraseLabelSchema,
  promptPhraseTagSchema,
} from "../image-generation/prompt-phrases";
import type { PromptGroup, PromptPhrase } from "../image-generation/prompt-phrases";
import { AdminColumns, AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";

type GroupDraft = { id: string | null; label: string };
type PhraseDraft = { id: string | null; label: string; tag: string };
type Deleting = { kind: "group"; item: PromptGroup } | { kind: "phrase"; item: PromptPhrase };

// よく使う表現: グループと表現の表、追加・編集・並べ替え・削除
export function PromptPhrasesScreen({
  groups,
  onChanged,
}: {
  groups: PromptGroup[];
  onChanged: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(groups[0]?.id ?? null);
  const [groupDraft, setGroupDraft] = useState<GroupDraft | null>(null);
  const [phraseDraft, setPhraseDraft] = useState<PhraseDraft | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 選んだグループが消えていたら最初のグループに寄せる。
  const selected = groups.find((group) => group.id === selectedId) ?? groups[0] ?? null;

  // 並べ替え・削除の共通処理。サーバーの結果にエラーがあれば知らせ、なければ読み直す。
  async function run(task: () => Promise<{ error?: string | null } | void>, done?: string) {
    setBusy(true);
    try {
      const result = await task();
      if (result && result.error) {
        toast(result.error);
        return;
      }
      if (done) toast(done);
      await onChanged();
    } catch (caught) {
      toast(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function openAddGroup() {
    setFormError(null);
    setGroupDraft({ id: null, label: "" });
  }

  function openAddPhrase() {
    setFormError(null);
    setPhraseDraft({ id: null, label: "", tag: "" });
  }

  async function saveGroup() {
    if (!groupDraft) return;
    const parsed = v.safeParse(promptGroupLabelSchema, groupDraft.label);
    if (!parsed.success) {
      setFormError(parsed.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await savePromptGroup({
        data: { id: groupDraft.id ?? crypto.randomUUID(), label: parsed.output },
      });
      setGroupDraft(null);
      toast("保存しました");
      await onChanged();
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function savePhrase() {
    if (!phraseDraft || !selected) return;
    const label = v.safeParse(promptPhraseLabelSchema, phraseDraft.label);
    if (!label.success) {
      setFormError(label.issues[0].message);
      return;
    }
    const tag = v.safeParse(promptPhraseTagSchema, phraseDraft.tag);
    if (!tag.success) {
      setFormError(tag.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const result = await savePromptPhrase({
        data: {
          id: phraseDraft.id ?? crypto.randomUUID(),
          groupId: selected.id,
          label: label.output,
          tag: tag.output,
        },
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setPhraseDraft(null);
      toast("保存しました");
      await onChanged();
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    const target = deleting;
    if (!target) return;
    void run(async () => {
      if (target.kind === "group") await deletePromptGroup({ data: { id: target.item.id } });
      else await deletePromptPhrase({ data: { id: target.item.id } });
      setDeleting(null);
    }, "削除しました");
  }

  return (
    <>
      <AdminHead
        eyebrow="Admin"
        title="よく使う表現"
        description="プロンプト入力の選択肢です。表示名は画面に出す名前、NovelAIへ送る語は生成に使う語です。"
        // グループがないときは空の表示の中の案内で追加するため、ここには出さない。
        actions={
          groups.length ? (
            <Button leadingIcon={<Icon name="plus" size="md" />} onClick={openAddGroup}>
              グループを追加
            </Button>
          ) : undefined
        }
      />
      <AdminColumns
        layout="split"
        primary={
          groups.length === 0 ? (
            <EmptyState
              title="グループがまだありません"
              actions={
                <Button leadingIcon={<Icon name="plus" size="sm" />} onClick={openAddGroup}>
                  最初のグループを追加
                </Button>
              }
            />
          ) : (
            <DataTable caption="グループ" columns={["名前", "表現", "並び", "操作"]}>
              {groups.map((group, index) => (
                <DataRow key={group.id} selected={group.id === selected?.id}>
                  <DataCell header kind="strong">
                    <Button
                      variant="link"
                      size="sm"
                      aria-pressed={group.id === selected?.id}
                      onClick={() => setSelectedId(group.id)}
                    >
                      {group.label}
                    </Button>
                  </DataCell>
                  <DataCell kind="number">{group.phrases.length}</DataCell>
                  <DataCell kind="actions">
                    <IconButton
                      variant="row"
                      icon="arrowUp"
                      label={`${group.label}を上へ`}
                      disabled={busy || index === 0}
                      onClick={() =>
                        void run(() => movePromptGroup({ data: { id: group.id, direction: "up" } }))
                      }
                    />
                    <IconButton
                      variant="row"
                      icon="arrowDown"
                      label={`${group.label}を下へ`}
                      disabled={busy || index === groups.length - 1}
                      onClick={() =>
                        void run(() =>
                          movePromptGroup({ data: { id: group.id, direction: "down" } }),
                        )
                      }
                    />
                  </DataCell>
                  <DataCell kind="actions">
                    <Button
                      variant="secondary"
                      size="xs"
                      aria-label={`${group.label}を編集`}
                      onClick={() => {
                        setFormError(null);
                        setGroupDraft({ id: group.id, label: group.label });
                      }}
                    >
                      編集
                    </Button>
                    <Button
                      variant="destructive"
                      size="xs"
                      aria-label={`${group.label}を削除`}
                      onClick={() => setDeleting({ kind: "group", item: group })}
                    >
                      削除
                    </Button>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          )
        }
        secondary={
          selected ? (
            <Stack gap="3">
              {selected.phrases.length ? (
                <DataTable
                  caption={`${selected.label}の表現`}
                  columns={["表示名", "NovelAIへ送る語", "並び", "操作"]}
                >
                  {selected.phrases.map((phrase, index) => (
                    <DataRow key={phrase.id}>
                      <DataCell header kind="strong">
                        {phrase.label}
                      </DataCell>
                      <DataCell>
                        <DataCode>{phrase.tag}</DataCode>
                      </DataCell>
                      <DataCell kind="actions">
                        <IconButton
                          variant="row"
                          icon="arrowUp"
                          label={`${phrase.label}を上へ`}
                          disabled={busy || index === 0}
                          onClick={() =>
                            void run(() =>
                              movePromptPhrase({ data: { id: phrase.id, direction: "up" } }),
                            )
                          }
                        />
                        <IconButton
                          variant="row"
                          icon="arrowDown"
                          label={`${phrase.label}を下へ`}
                          disabled={busy || index === selected.phrases.length - 1}
                          onClick={() =>
                            void run(() =>
                              movePromptPhrase({ data: { id: phrase.id, direction: "down" } }),
                            )
                          }
                        />
                      </DataCell>
                      <DataCell kind="actions">
                        <Button
                          variant="secondary"
                          size="xs"
                          aria-label={`${phrase.label}を編集`}
                          onClick={() => {
                            setFormError(null);
                            setPhraseDraft({ id: phrase.id, label: phrase.label, tag: phrase.tag });
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          aria-label={`${phrase.label}を削除`}
                          onClick={() => setDeleting({ kind: "phrase", item: phrase })}
                        >
                          削除
                        </Button>
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
              ) : (
                <EmptyState title="表現がまだありません" />
              )}
              <Stack direction="row">
                <Button
                  variant="secondary"
                  size="sm"
                  leadingIcon={<Icon name="plus" size="sm" />}
                  onClick={openAddPhrase}
                >
                  表現を追加
                </Button>
              </Stack>
            </Stack>
          ) : null
        }
      />
      <Dialog
        open={groupDraft !== null}
        onOpenChange={(open) => {
          if (!open) setGroupDraft(null);
        }}
        title={groupDraft?.id ? "グループを編集" : "グループを追加"}
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button loading={busy} onClick={() => void saveGroup()}>
              保存する
            </Button>
          </>
        }
      >
        {groupDraft ? (
          <Stack gap="3">
            <TextField
              label="グループの名前"
              value={groupDraft.label}
              maxLength={20}
              helperText="20文字まで"
              onChange={(event) => setGroupDraft({ ...groupDraft, label: event.target.value })}
            />
            {formError ? (
              <Text variant="note" tone="danger" role="alert">
                {formError}
              </Text>
            ) : null}
          </Stack>
        ) : null}
      </Dialog>
      <Dialog
        open={phraseDraft !== null}
        onOpenChange={(open) => {
          if (!open) setPhraseDraft(null);
        }}
        title={phraseDraft?.id ? "表現を編集" : "表現を追加"}
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button loading={busy} onClick={() => void savePhrase()}>
              保存する
            </Button>
          </>
        }
      >
        {phraseDraft ? (
          <Stack gap="3">
            <TextField
              label="表示名"
              value={phraseDraft.label}
              maxLength={30}
              helperText="30文字まで"
              onChange={(event) => setPhraseDraft({ ...phraseDraft, label: event.target.value })}
            />
            <TextField
              label="NovelAIへ送る語"
              value={phraseDraft.tag}
              maxLength={200}
              helperText="200文字まで"
              onChange={(event) => setPhraseDraft({ ...phraseDraft, tag: event.target.value })}
            />
            {formError ? (
              <Text variant="note" tone="danger" role="alert">
                {formError}
              </Text>
            ) : null}
          </Stack>
        ) : null}
      </Dialog>
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        role="alertdialog"
        title={deleting?.kind === "phrase" ? "表現を削除しますか？" : "グループを削除しますか？"}
        description={deleting?.kind === "group" ? "中の表現もすべて削除します。" : undefined}
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button variant="destructive" loading={busy} onClick={confirmDelete}>
              削除する
            </Button>
          </>
        }
      />
    </>
  );
}
