import { useId, useState } from "react";
import * as v from "valibot";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { FileButton } from "@animic/react/file-button";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { IconButton } from "@animic/react/icon-button";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { Textarea } from "@animic/react/textarea";
import { useToast } from "@animic/react/toast";
import { sourceImageTypes, toWebp } from "../../lib/webp-file";
import { phraseImageMaxSide, phraseImagePath } from "../image-generation/phrase-images";
import { phraseName } from "../image-generation/prompt-dictionary";
import {
  deletePromptGroup,
  deletePromptPhrase,
  deletePromptPhraseImage,
  movePromptGroup,
  movePromptPhrase,
  savePromptGroup,
  savePromptPhrase,
  savePromptPhraseImage,
} from "../image-generation/prompt-phrases.functions";
import {
  promptGroupLabelSchema,
  promptPhraseLabelSchema,
  promptPhraseNoteSchema,
  promptPhraseSuffixSchema,
  promptPhraseTagSchema,
  promptTargets,
  promptTargetSchema,
  promptTones,
  promptToneSchema,
} from "../image-generation/prompt-phrases";
import type {
  PromptGroup,
  PromptPhrase,
  PromptTarget,
  PromptTone,
} from "../image-generation/prompt-phrases";
import { AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";

type GroupDraft = {
  id: string;
  isNew: boolean;
  label: string;
  tone: PromptTone;
  target: PromptTarget;
};
/** 選んで変換した挿絵と、プレビューに使うURL。 */
type PickedImage = { blob: Blob; url: string };
type PhraseDraft = {
  id: string;
  isNew: boolean;
  label: string;
  suffix: string;
  tag: string;
  note: string;
  /** 保存済みの挿絵 */
  imageId: string | null;
  /** 保存するときに差し替える挿絵 */
  picked: PickedImage | null;
  /** 保存するときに挿絵を外すか */
  removeImage: boolean;
};

const TARGET_LABELS: Record<PromptTarget, string> = {
  base: "ベース",
  character: "キャラ",
  both: "両方",
};

const TARGET_SECTION_LABELS: Record<PromptTarget, string> = {
  base: "ベースの欄に入れるグループ",
  character: "キャラの欄に入れるグループ",
  both: "両方の欄に入れるグループ",
};

const TONE_LABELS: Record<PromptTone, string> = {
  ink: "黒",
  pink: "ピンク",
  rose: "薄いピンク",
  red: "赤",
  orange: "オレンジ",
  amber: "黄土色",
  yellow: "黄色",
  green: "緑",
  forest: "深緑",
  cyan: "水色",
  purple: "紫",
  slate: "灰色",
};
type Deleting = { kind: "group"; item: PromptGroup } | { kind: "phrase"; item: PromptPhrase };

// 表現のカード: 挿絵・表示名・語と、挿絵の変更・編集・並べ替え・削除
function PhraseCard({
  phrase,
  first,
  last,
  busy,
  onPickImage,
  onEdit,
  onMove,
  onDelete,
}: {
  phrase: PromptPhrase;
  first: boolean;
  last: boolean;
  busy: boolean;
  onPickImage: (file: File) => void;
  onEdit: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}) {
  return (
    <article aria-label={phraseName(phrase)}>
      <Surface appearance="card" padding="md">
        <Stack space="compact">
          {phrase.imageId ? (
            <Media
              src={phraseImagePath({ phraseId: phrase.id, imageId: phrase.imageId })}
              alt={`${phrase.label}の挿絵`}
              aspect="square"
              fit="contain"
            />
          ) : (
            <MediaPlaceholder aspect="square" label="挿絵なし">
              <Text variant="caption" tone="muted">
                挿絵なし
              </Text>
            </MediaPlaceholder>
          )}
          <Text variant="label">
            {phrase.label}
            {phrase.suffix && (
              <Text variant="inherit" tone="muted">
                {phrase.suffix}
              </Text>
            )}
          </Text>
          <Text variant="code.compact">{phrase.tag}</Text>
          {phrase.note && (
            <Text variant="caption" tone="muted">
              {phrase.note}
            </Text>
          )}
          <Cluster>
            <FileButton
              label={phrase.imageId ? "挿絵を変える" : "挿絵を追加"}
              accept={sourceImageTypes.join(",")}
              loading={busy}
              onFile={onPickImage}
            />
            <Button
              appearance="secondary"
              size="sm"
              aria-label={`${phrase.label}を編集`}
              loading={busy}
              onClick={onEdit}
            >
              編集
            </Button>
          </Cluster>
          <Cluster justify="between">
            <Cluster layout="nowrap">
              <IconButton
                label={`${phrase.label}を前へ`}
                appearance="quiet"
                size="sm"
                disabled={first}
                loading={busy}
                onClick={() => onMove("up")}
              >
                ←
              </IconButton>
              <IconButton
                label={`${phrase.label}を後ろへ`}
                appearance="quiet"
                size="sm"
                disabled={last}
                loading={busy}
                onClick={() => onMove("down")}
              >
                →
              </IconButton>
            </Cluster>
            <Button
              appearance="quiet"
              size="sm"
              aria-label={`${phrase.label}を削除`}
              loading={busy}
              onClick={onDelete}
            >
              削除
            </Button>
          </Cluster>
        </Stack>
      </Surface>
    </article>
  );
}

/** 選んだ挿絵を登録するか、外す。変えていなければ何もしない。 */
async function saveImageChange(draft: PhraseDraft): Promise<{ error: string | null }> {
  if (draft.picked) {
    const form = new FormData();
    form.set("id", draft.id);
    form.set("file", new File([draft.picked.blob], "phrase.webp", { type: "image/webp" }));
    return savePromptPhraseImage({ data: form });
  }
  if (draft.removeImage && draft.imageId)
    return deletePromptPhraseImage({ data: { id: draft.id } });
  return { error: null };
}

// 表現の編集ダイアログの挿絵: プレビュー・選ぶ・外す
function PhraseImageField({
  labelId,
  draft,
  busy,
  onPick,
  onRemove,
}: {
  labelId: string;
  draft: PhraseDraft;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const saved =
    draft.imageId && !draft.removeImage
      ? phraseImagePath({ phraseId: draft.id, imageId: draft.imageId })
      : null;
  const preview = draft.picked?.url ?? saved;
  return (
    <div role="group" aria-labelledby={labelId}>
      <Stack space="compact">
        <Text variant="label" id={labelId}>
          挿絵
        </Text>
        {preview ? (
          <Media
            src={preview}
            alt="挿絵のプレビュー"
            size="preview"
            aspect="square"
            fit="contain"
          />
        ) : (
          <Text tone="muted">挿絵はありません</Text>
        )}
        <Text variant="body.sm" tone="muted">
          PNG・WebP・JPEG（10MBまで）。検索のカードには中央を横長に切り抜いて出し、カードの拡大ボタンで全体を出します
        </Text>
        <Cluster>
          <FileButton
            label={preview ? "画像を選び直す" : "画像を選ぶ"}
            accept={sourceImageTypes.join(",")}
            loading={busy}
            onFile={onPick}
          />
          {preview && (
            <Button appearance="quiet" size="sm" loading={busy} onClick={onRemove}>
              挿絵を外す
            </Button>
          )}
        </Cluster>
      </Stack>
    </div>
  );
}

// 表現の辞書: グループを選び、表現を挿絵つきのカードで並べる。追加・編集・並べ替え・削除
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
  const imageLabel = useId();
  const groupsHeading = useId();
  const [selectedId, setSelectedId] = useState<string | null>(groups[0]?.id ?? null);
  const [groupDraft, setGroupDraft] = useState<GroupDraft | null>(null);
  const [phraseDraft, setPhraseDraftState] = useState<PhraseDraft | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 選んだグループが消えていたら最初のグループに寄せる。
  const selected = groups.find((group) => group.id === selectedId) ?? groups[0] ?? null;
  // グループは入れる欄ごとに分けて並べ、並べ替えも同じ欄のグループの中で行う。
  const sections = promptTargets
    .map((target) => ({ target, groups: groups.filter((group) => group.target === target) }))
    .filter((section) => section.groups.length > 0);
  const siblings = groups.filter((group) => group.target === selected?.target);

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

  /** 表現の下書きを変える。使わなくなった挿絵のプレビューURLは解放する。 */
  function setPhraseDraft(next: PhraseDraft | null) {
    const previous = phraseDraft?.picked;
    if (previous && previous !== next?.picked) URL.revokeObjectURL(previous.url);
    setPhraseDraftState(next);
  }

  function openAddGroup() {
    setFormError(null);
    setGroupDraft({
      id: crypto.randomUUID(),
      isNew: true,
      label: "",
      tone: "slate",
      target: "both",
    });
  }

  function openAddPhrase() {
    setFormError(null);
    setPhraseDraft({
      id: crypto.randomUUID(),
      isNew: true,
      label: "",
      suffix: "",
      tag: "",
      note: "",
      imageId: null,
      picked: null,
      removeImage: false,
    });
  }

  function openEditPhrase(phrase: PromptPhrase) {
    setFormError(null);
    setPhraseDraft({
      id: phrase.id,
      isNew: false,
      label: phrase.label,
      suffix: phrase.suffix,
      tag: phrase.tag,
      note: phrase.note,
      imageId: phrase.imageId,
      picked: null,
      removeImage: false,
    });
  }

  /** カードで選んだ画像を、すぐに挿絵として保存する。 */
  function replaceImage(phrase: PromptPhrase, file: File) {
    void run(async () => {
      const blob = await toWebp(file, phraseImageMaxSide);
      const form = new FormData();
      form.set("id", phrase.id);
      form.set("file", new File([blob], "phrase.webp", { type: "image/webp" }));
      return savePromptPhraseImage({ data: form });
    }, "挿絵を保存しました");
  }

  async function pickImage(file: File) {
    if (!phraseDraft || busy) return;
    setFormError(null);
    setBusy(true);
    try {
      const blob = await toWebp(file, phraseImageMaxSide);
      setPhraseDraft({
        ...phraseDraft,
        picked: { blob, url: URL.createObjectURL(blob) },
        removeImage: false,
      });
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
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
        data: {
          id: groupDraft.id,
          label: parsed.output,
          tone: groupDraft.tone,
          target: groupDraft.target,
        },
      });
      await onChanged();
      if (groupDraft.isNew) setSelectedId(groupDraft.id);
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
    const suffix = v.safeParse(promptPhraseSuffixSchema, phraseDraft.suffix);
    if (!suffix.success) {
      setFormError(suffix.issues[0].message);
      return;
    }
    const tag = v.safeParse(promptPhraseTagSchema, phraseDraft.tag);
    if (!tag.success) {
      setFormError(tag.issues[0].message);
      return;
    }
    const note = v.safeParse(promptPhraseNoteSchema, phraseDraft.note);
    if (!note.success) {
      setFormError(note.issues[0].message);
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
          suffix: suffix.output,
          tag: tag.output,
          note: note.output,
        },
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      const image = await saveImageChange(phraseDraft);
      await onChanged();
      if (image.error) {
        // 表現は保存できたため、挿絵だけをやり直せるようにする。
        setPhraseDraft({ ...phraseDraft, isNew: false });
        setFormError(image.error);
        return;
      }
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
        title="表現の辞書"
        description="対戦画面のプロンプトの入力候補と検索に出す表現です。変えた内容は、参加者が次にルームを開いたときから使います。"
        actions={
          groups.length > 0 ? (
            <Button loading={busy} onClick={openAddGroup}>
              グループを追加
            </Button>
          ) : undefined
        }
      />
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
        <section aria-labelledby={groupsHeading}>
          <Stack space="compact">
            <Heading id={groupsHeading} level={2} size="sm">
              グループ
            </Heading>
            {sections.map((section) => (
              <SegmentedControl
                key={section.target}
                label={TARGET_SECTION_LABELS[section.target]}
                labelVisibility="visible"
                appearance="chips"
                value={selected?.target === section.target ? selected.id : ""}
                disabled={busy}
                options={section.groups.map((group) => ({
                  value: group.id,
                  label: group.label,
                  detail: group.phrases.length,
                  markerTone: group.tone,
                }))}
                onValueChange={setSelectedId}
              />
            ))}
          </Stack>
        </section>
      )}
      {selected && (
        <section aria-label={`${selected.label}の表現`}>
          <Stack>
            <Cluster justify="between">
              <Stack space="tight">
                <Heading level={2} size="sm">
                  {selected.label}の表現（{selected.phrases.length}件）
                </Heading>
                <Text variant="caption" tone="muted">
                  入れる欄：{TARGET_LABELS[selected.target]}
                </Text>
              </Stack>
              <Button appearance="secondary" size="sm" loading={busy} onClick={openAddPhrase}>
                表現を追加
              </Button>
            </Cluster>
            <Cluster>
              <Button
                appearance="secondary"
                size="sm"
                loading={busy}
                onClick={() => {
                  setFormError(null);
                  setGroupDraft({
                    id: selected.id,
                    isNew: false,
                    label: selected.label,
                    tone: selected.tone,
                    target: selected.target,
                  });
                }}
              >
                グループの名前・色・入れる欄を変える
              </Button>
              <IconButton
                label={`${selected.label}を前へ`}
                appearance="quiet"
                size="sm"
                disabled={siblings[0]?.id === selected.id}
                loading={busy}
                onClick={() =>
                  void run(() => movePromptGroup({ data: { id: selected.id, direction: "up" } }))
                }
              >
                ←
              </IconButton>
              <IconButton
                label={`${selected.label}を後ろへ`}
                appearance="quiet"
                size="sm"
                disabled={siblings.at(-1)?.id === selected.id}
                loading={busy}
                onClick={() =>
                  void run(() => movePromptGroup({ data: { id: selected.id, direction: "down" } }))
                }
              >
                →
              </IconButton>
              <Button
                appearance="quiet"
                size="sm"
                loading={busy}
                onClick={() => setDeleting({ kind: "group", item: selected })}
              >
                グループを削除
              </Button>
            </Cluster>
            {selected.phrases.length === 0 ? (
              <Text tone="muted">表現がまだありません</Text>
            ) : (
              <Grid columns={4}>
                {selected.phrases.map((phrase, index) => (
                  <PhraseCard
                    key={phrase.id}
                    phrase={phrase}
                    first={index === 0}
                    last={index === selected.phrases.length - 1}
                    busy={busy}
                    onPickImage={(file) => replaceImage(phrase, file)}
                    onEdit={() => openEditPhrase(phrase)}
                    onMove={(direction) =>
                      void run(() => movePromptPhrase({ data: { id: phrase.id, direction } }))
                    }
                    onDelete={() => setDeleting({ kind: "phrase", item: phrase })}
                  />
                ))}
              </Grid>
            )}
          </Stack>
        </section>
      )}
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
              <SegmentedControl
                label="入れる欄"
                labelVisibility="visible"
                appearance="chips"
                value={groupDraft.target}
                disabled={busy}
                options={promptTargets.map((target) => ({
                  value: target,
                  label: TARGET_LABELS[target],
                }))}
                onValueChange={(value) => {
                  const target = v.safeParse(promptTargetSchema, value);
                  if (target.success) setGroupDraft({ ...groupDraft, target: target.output });
                }}
              />
              <Text variant="caption" tone="muted">
                対戦画面の検索と入力候補で、ベースの欄にはベース・両方、キャラの欄にはキャラ・両方のグループを出します。
              </Text>
              <SegmentedControl
                label="目印の色"
                labelVisibility="visible"
                appearance="chips"
                value={groupDraft.tone}
                disabled={busy}
                options={promptTones.map((tone) => ({
                  value: tone,
                  label: TONE_LABELS[tone],
                  markerTone: tone,
                }))}
                onValueChange={(value) => {
                  const tone = v.safeParse(promptToneSchema, value);
                  if (tone.success) setGroupDraft({ ...groupDraft, tone: tone.output });
                }}
              />
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
              <Field
                label="表示名"
                description="30文字まで。文章で入力するときは、この名前がプロンプトに入ります"
              >
                <Input
                  value={phraseDraft.label}
                  maxLength={30}
                  disabled={busy}
                  onChange={(event) =>
                    setPhraseDraft({ ...phraseDraft, label: event.target.value })
                  }
                />
              </Field>
              <Field
                label="サフィックス"
                description="20文字まで。表示名の後ろに出す補足で、プロンプトには入りません（例：（2本の三つ編み））"
              >
                <Input
                  value={phraseDraft.suffix}
                  maxLength={20}
                  disabled={busy}
                  onChange={(event) =>
                    setPhraseDraft({ ...phraseDraft, suffix: event.target.value })
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
              <Field label="注釈" description="100文字まで。検索のカードに出します">
                <Textarea
                  value={phraseDraft.note}
                  maxLength={100}
                  rows={2}
                  disabled={busy}
                  onChange={(event) => setPhraseDraft({ ...phraseDraft, note: event.target.value })}
                />
              </Field>
              <PhraseImageField
                labelId={imageLabel}
                draft={phraseDraft}
                busy={busy}
                onPick={(file) => void pickImage(file)}
                onRemove={() => setPhraseDraft({ ...phraseDraft, picked: null, removeImage: true })}
              />
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
