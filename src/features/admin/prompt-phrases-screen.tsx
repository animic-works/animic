import { Split } from "@animic/react/split";
import { useId, useState } from "react";
import * as v from "valibot";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { DataTable, type DataTableColumn } from "@animic/react/data-table";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { Input } from "@animic/react/input";
import { IconButton } from "@animic/react/icon-button";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
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
import { AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";

type GroupDraft = { id: string; isNew: boolean; label: string };
type PhraseDraft = { id: string; isNew: boolean; label: string; tag: string };
type Deleting = { kind: "group"; item: PromptGroup } | { kind: "phrase"; item: PromptPhrase };

type RunMutation = (
  task: () => Promise<{ error?: string | null } | void>,
  done?: string,
) => Promise<void>;

function groupColumns({
  groups,
  selected,
  busy,
  run,
  setSelectedId,
  setFormError,
  setGroupDraft,
  setDeleting,
}: {
  groups: PromptGroup[];
  selected: PromptGroup | null;
  busy: boolean;
  run: RunMutation;
  setSelectedId: (id: string) => void;
  setFormError: (error: string | null) => void;
  setGroupDraft: (draft: GroupDraft) => void;
  setDeleting: (target: Deleting) => void;
}): DataTableColumn<PromptGroup>[] {
  return [
    {
      id: "name",
      header: "名前",
      rowHeader: true,
      cell: (group) => (
        <Button
          appearance="quiet"
          size="sm"
          loading={busy}
          aria-pressed={group.id === selected?.id}
          onClick={() => setSelectedId(group.id)}
        >
          {group.label}
        </Button>
      ),
    },
    { id: "count", header: "表現", cell: (group) => group.phrases.length },
    {
      id: "order",
      header: "並び",
      cell: (group) => (
        <Cluster layout="nowrap">
          <IconButton
            label={`${group.label}を上へ`}
            appearance="quiet"
            size="sm"
            disabled={groups[0]?.id === group.id}
            loading={busy}
            onClick={() =>
              void run(() => movePromptGroup({ data: { id: group.id, direction: "up" } }))
            }
          >
            ↑
          </IconButton>
          <IconButton
            label={`${group.label}を下へ`}
            appearance="quiet"
            size="sm"
            disabled={groups.at(-1)?.id === group.id}
            loading={busy}
            onClick={() =>
              void run(() => movePromptGroup({ data: { id: group.id, direction: "down" } }))
            }
          >
            ↓
          </IconButton>
        </Cluster>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: (group) => (
        <Cluster layout="nowrap">
          <Button
            appearance="secondary"
            size="sm"
            aria-label={`${group.label}を編集`}
            loading={busy}
            onClick={() => {
              setFormError(null);
              setGroupDraft({ id: group.id, isNew: false, label: group.label });
            }}
          >
            編集
          </Button>
          <Button
            appearance="quiet"
            size="sm"
            aria-label={`${group.label}を削除`}
            loading={busy}
            onClick={() => setDeleting({ kind: "group", item: group })}
          >
            削除
          </Button>
        </Cluster>
      ),
    },
  ];
}

function phraseColumns({
  selected,
  busy,
  run,
  setFormError,
  setPhraseDraft,
  setDeleting,
}: {
  selected: PromptGroup;
  busy: boolean;
  run: RunMutation;
  setFormError: (error: string | null) => void;
  setPhraseDraft: (draft: PhraseDraft) => void;
  setDeleting: (target: Deleting) => void;
}): DataTableColumn<PromptPhrase>[] {
  return [
    {
      id: "label",
      header: "表示名",
      rowHeader: true,
      cell: (phrase) => phrase.label,
    },
    {
      id: "tag",
      header: "NovelAIへ送る語",
      cell: (phrase) => <Text variant="code.compact">{phrase.tag}</Text>,
    },
    {
      id: "order",
      header: "並び",
      cell: (phrase) => (
        <Cluster layout="nowrap">
          <IconButton
            label={`${phrase.label}を上へ`}
            appearance="quiet"
            size="sm"
            disabled={selected.phrases[0]?.id === phrase.id}
            loading={busy}
            onClick={() =>
              void run(() => movePromptPhrase({ data: { id: phrase.id, direction: "up" } }))
            }
          >
            ↑
          </IconButton>
          <IconButton
            label={`${phrase.label}を下へ`}
            appearance="quiet"
            size="sm"
            disabled={selected.phrases.at(-1)?.id === phrase.id}
            loading={busy}
            onClick={() =>
              void run(() => movePromptPhrase({ data: { id: phrase.id, direction: "down" } }))
            }
          >
            ↓
          </IconButton>
        </Cluster>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: (phrase) => (
        <Cluster layout="nowrap">
          <Button
            appearance="secondary"
            size="sm"
            aria-label={`${phrase.label}を編集`}
            loading={busy}
            onClick={() => {
              setFormError(null);
              setPhraseDraft({
                id: phrase.id,
                isNew: false,
                label: phrase.label,
                tag: phrase.tag,
              });
            }}
          >
            編集
          </Button>
          <Button
            appearance="quiet"
            size="sm"
            aria-label={`${phrase.label}を削除`}
            loading={busy}
            onClick={() => setDeleting({ kind: "phrase", item: phrase })}
          >
            削除
          </Button>
        </Cluster>
      ),
    },
  ];
}

// よく使う表現: グループと表現の表、追加・編集・並べ替え・削除
export function PromptPhrasesScreen({
  groups,
  onChanged,
}: {
  groups: PromptGroup[];
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const groupForm = useId();
  const phraseForm = useId();
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
    if (busy) return;
    setBusy(true);
    try {
      const result = await task();
      if (result && result.error) {
        toast.show({ title: result.error });
        return;
      }
      if (done) toast.show({ title: done });
      await onChanged();
    } catch (caught) {
      toast.show({ title: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  }

  function openAddGroup() {
    setFormError(null);
    setGroupDraft({ id: crypto.randomUUID(), isNew: true, label: "" });
  }

  function openAddPhrase() {
    setFormError(null);
    setPhraseDraft({ id: crypto.randomUUID(), isNew: true, label: "", tag: "" });
  }

  async function saveGroup() {
    if (!groupDraft) return;
    const parsed = v.safeParse(promptGroupLabelSchema, groupDraft.label);
    if (!parsed.success) {
      setFormError(parsed.issues[0].message);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await savePromptGroup({
        data: { id: groupDraft.id, label: parsed.output },
      });
      await onChanged();
      setGroupDraft(null);
      toast.show({ title: "保存しました" });
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
    if (busy) return;
    setBusy(true);
    try {
      const result = await savePromptPhrase({
        data: {
          id: phraseDraft.id,
          groupId: selected.id,
          label: label.output,
          tag: tag.output,
        },
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      await onChanged();
      setPhraseDraft(null);
      toast.show({ title: "保存しました" });
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
    <Stack space="section">
      <AdminHead
        eyebrow="Admin"
        title="よく使う表現"
        description="プロンプト入力の選択肢です。表示名は画面に出す名前、NovelAIへ送る語は生成に使う語です。"
        actions={
          groups.length > 0 ? (
            <Button loading={busy} onClick={openAddGroup}>
              グループを追加
            </Button>
          ) : undefined
        }
      />
      <Split layout="balanced">
        {groups.length === 0 ? (
          <Stack>
            <Text>グループがまだありません</Text>
            <Cluster>
              <Button loading={busy} onClick={openAddGroup}>
                最初のグループを追加
              </Button>
            </Cluster>
          </Stack>
        ) : (
          <DataTable
            label="グループ"
            rows={groups}
            getRowKey={(group) => group.id}
            empty="グループがまだありません"
            columns={groupColumns({
              groups,
              selected,
              busy,
              run,
              setSelectedId,
              setFormError,
              setGroupDraft,
              setDeleting,
            })}
          />
        )}
        {selected && (
          <Stack>
            <DataTable
              label={`${selected.label}の表現`}
              rows={selected.phrases}
              getRowKey={(phrase) => phrase.id}
              empty="表現がまだありません"
              columns={phraseColumns({
                selected,
                busy,
                run,
                setFormError,
                setPhraseDraft,
                setDeleting,
              })}
            />
            <Cluster>
              <Button appearance="secondary" size="sm" loading={busy} onClick={openAddPhrase}>
                表現を追加
              </Button>
            </Cluster>
          </Stack>
        )}
      </Split>
      <Dialog
        size="compact"
        presentation="centered"
        open={groupDraft !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setGroupDraft(null);
        }}
        dismissible={!busy}
        closeButton={!busy}
        title={groupDraft?.isNew ? "グループを追加" : "グループを編集"}
        footer={
          <Cluster justify="end">
            <Button appearance="secondary" loading={busy} onClick={() => setGroupDraft(null)}>
              やめる
            </Button>
            <Button form={groupForm} type="submit" loading={busy}>
              保存する
            </Button>
          </Cluster>
        }
      >
        {groupDraft && (
          <form
            id={groupForm}
            onSubmit={(event) => {
              event.preventDefault();
              void saveGroup();
            }}
          >
            <Stack>
              <Field label="グループの名前" description="20文字まで" error={formError ?? undefined}>
                <Input
                  value={groupDraft.label}
                  maxLength={20}
                  disabled={busy}
                  onChange={(event) => setGroupDraft({ ...groupDraft, label: event.target.value })}
                />
              </Field>
            </Stack>
          </form>
        )}
      </Dialog>
      <Dialog
        size="compact"
        presentation="centered"
        open={phraseDraft !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPhraseDraft(null);
        }}
        dismissible={!busy}
        closeButton={!busy}
        title={phraseDraft?.isNew ? "表現を追加" : "表現を編集"}
        footer={
          <Cluster justify="end">
            <Button appearance="secondary" loading={busy} onClick={() => setPhraseDraft(null)}>
              やめる
            </Button>
            <Button form={phraseForm} type="submit" loading={busy}>
              保存する
            </Button>
          </Cluster>
        }
      >
        {phraseDraft && (
          <form
            id={phraseForm}
            onSubmit={(event) => {
              event.preventDefault();
              void savePhrase();
            }}
          >
            <Stack>
              <Field label="表示名" description="30文字まで">
                <Input
                  value={phraseDraft.label}
                  maxLength={30}
                  disabled={busy}
                  onChange={(event) =>
                    setPhraseDraft({ ...phraseDraft, label: event.target.value })
                  }
                />
              </Field>
              <Field label="NovelAIへ送る語" description="200文字まで">
                <Input
                  value={phraseDraft.tag}
                  maxLength={200}
                  disabled={busy}
                  onChange={(event) => setPhraseDraft({ ...phraseDraft, tag: event.target.value })}
                />
              </Field>
              {formError && (
                <div role="alert">
                  <Text tone="danger">{formError}</Text>
                </div>
              )}
            </Stack>
          </form>
        )}
      </Dialog>
      <Dialog
        size="compact"
        presentation="centered"
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
        dismissible={!busy}
        closeButton={!busy}
        title={deleting?.kind === "phrase" ? "表現を削除しますか？" : "グループを削除しますか？"}
        description={deleting?.kind === "group" ? "中の表現もすべて削除します。" : undefined}
        footer={
          <Cluster justify="end">
            <Button appearance="secondary" loading={busy} onClick={() => setDeleting(null)}>
              やめる
            </Button>
            <Button loading={busy} onClick={confirmDelete}>
              削除する
            </Button>
          </Cluster>
        }
      >
        {deleting && <Text>{deleting.item.label}</Text>}
      </Dialog>
    </Stack>
  );
}
