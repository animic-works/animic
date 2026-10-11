import { useId, useState } from "react";
import type { ReactNode } from "react";
import * as v from "valibot";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { FileButton } from "@animic/react/file-button";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { IconButton } from "@animic/react/icon-button";
import { Input } from "@animic/react/input";
import { Media } from "@animic/react/media";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { Textarea } from "@animic/react/textarea";
import { useToast } from "@animic/react/toast";
import { toPng } from "../../lib/png-file";
import { sourceImageTypes, toWebp } from "../../lib/webp-file";
import { DIFFICULTIES, getDifficulty } from "../battle/battle-labels";
import { difficultySchema } from "../battle/battle-state";
import {
  galleryItemTextSchema,
  homeItemTextSchema,
  howSteps,
  ogImageSize,
  scoringSteps,
} from "../home/home-content";
import type { GalleryItem, HomeContent, HomeItem } from "../home/home-content";
import {
  deleteGalleryItem,
  deleteOgImage,
  moveGalleryItem,
  saveGalleryItem,
  saveHomeItem,
  saveOgImage,
} from "../home/home-content.functions";
import { ScoreArtwork, StepArtwork } from "../home/visuals/home-artwork";
import { scoringMetrics } from "../scoring/scoring-metrics";
import type { ScoringWeights } from "../scoring/scoring-metrics";
import { errorMessage } from "./admin-format";
import { AdminHead } from "./admin-parts";

/** 遊び方・採点方法・ギャラリーの画像の長い辺の上限（px）。トップページの枠より大きく、重くなりすぎない大きさ。 */
const siteImageMaxSide = 1600;

/** 選んで変換した画像と、プレビューに使うURL。 */
type PickedImage = { blob: Blob; url: string };

type ItemDraft = {
  item: HomeItem;
  title: string;
  description: string;
  picked: PickedImage | null;
  removeImage: boolean;
};

type MetricDraft = Record<keyof ScoringWeights, string>;
type GalleryDraft = {
  id: string;
  isNew: boolean;
  difficulty: GalleryItem["difficulty"];
  score: string;
  metrics: MetricDraft;
  topicAlt: string;
  shotAlt: string;
  topicSrc: string | null;
  shotSrc: string | null;
  topic: PickedImage | null;
  shot: PickedImage | null;
};

/** 入力を数にする。数字以外を含む欄は`NaN`にして、検証で理由を出す。 */
const toNumber = (value: string) =>
  /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : Number.NaN;

async function pick(file: File): Promise<PickedImage> {
  const blob = await toWebp(file, siteImageMaxSide);
  return { blob, url: URL.createObjectURL(blob) };
}

function release(...images: (PickedImage | null)[]) {
  for (const image of images) if (image) URL.revokeObjectURL(image.url);
}

function contentForm(data: unknown, files: Record<string, Blob | null>) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  for (const [name, blob] of Object.entries(files))
    if (blob) form.set(name, new File([blob], `${name}.webp`, { type: blob.type }));
  return form;
}

/**
 * 画像を登録していない項目にトップページで出す、既定の絵と説明。
 * 手順1はイラストの画像、ほかの項目はアイコンの図。
 */
function DefaultArtwork({ id }: { id: string }) {
  const step = howSteps.find((item) => item.id === id);
  const score = scoringSteps.find((item) => item.id === id);
  return (
    <Stack space="tight">
      {step ? (
        <StepArtwork kind={step.illustration} preview />
      ) : (
        <ScoreArtwork kind={score?.illustration ?? "similarity"} />
      )}
      <Text variant="caption" tone="muted">
        {step?.illustration === "room"
          ? "既定のイラスト（画像を登録すると置き換わります）"
          : "既定の図（画像を登録すると置き換わります）"}
      </Text>
    </Stack>
  );
}

// 遊び方・採点方法の項目のカード
function ItemCard({
  item,
  label,
  busy,
  onEdit,
}: {
  item: HomeItem;
  label: string;
  busy: boolean;
  onEdit: () => void;
}) {
  return (
    <Surface appearance="card" padding="content">
      <Stack space="compact">
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        {item.image ? (
          <Media src={item.image} alt={`${item.title}の画像`} aspect="landscape" fit="cover" />
        ) : (
          <DefaultArtwork id={item.id} />
        )}
        <Heading level={3} size="sm">
          {item.title}
        </Heading>
        <Text variant="body.sm">{item.description}</Text>
        <Cluster>
          <Button appearance="secondary" size="sm" loading={busy} onClick={onEdit}>
            {`${label}を編集`}
          </Button>
        </Cluster>
      </Stack>
    </Surface>
  );
}

// 画像を選ぶ欄: プレビュー・選ぶ・外す
function ImageField({
  label,
  preview,
  busy,
  note,
  fallback,
  onPick,
  onRemove,
}: {
  label: string;
  preview: string | null;
  busy: boolean;
  note: string;
  /** 画像がないときに代わりに出すもの */
  fallback?: ReactNode;
  onPick: (file: File) => void;
  onRemove?: () => void;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}>
      <Stack space="compact">
        <Text variant="label" id={labelId}>
          {label}
        </Text>
        {preview ? (
          <Media
            src={preview}
            alt={`${label}のプレビュー`}
            size="preview"
            aspect="square"
            fit="contain"
          />
        ) : (
          (fallback ?? <Text tone="muted">画像はありません</Text>)
        )}
        <Text variant="body.sm" tone="muted">
          {note}
        </Text>
        <Cluster>
          <FileButton
            label={preview ? `${label}を選び直す` : `${label}を選ぶ`}
            accept={sourceImageTypes.join(",")}
            loading={busy}
            onFile={onPick}
          />
          {preview && onRemove && (
            <Button appearance="quiet" size="sm" loading={busy} onClick={onRemove}>
              {`${label}を外す`}
            </Button>
          )}
        </Cluster>
      </Stack>
    </div>
  );
}

const toGalleryDraft = (item: GalleryItem | null): GalleryDraft => ({
  id: item?.id ?? crypto.randomUUID(),
  isNew: !item,
  difficulty: item?.difficulty ?? "easy",
  score: item ? String(item.score) : "",
  metrics: {
    ccip: item ? String(item.metrics.ccip) : "",
    pixai: item ? String(item.metrics.pixai) : "",
    siglip2: item ? String(item.metrics.siglip2) : "",
    dinov2: item ? String(item.metrics.dinov2) : "",
    depth: item ? String(item.metrics.depth) : "",
  },
  topicAlt: item?.topicAlt ?? "",
  shotAlt: item?.shotAlt ?? "",
  topicSrc: item?.topicSrc ?? null,
  shotSrc: item?.shotSrc ?? null,
  topic: null,
  shot: null,
});

// トップページ: 遊び方・採点方法・ギャラリーとOGP画像の編集
export function HomeContentScreen({
  content,
  onChanged,
}: {
  content: HomeContent;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const itemForm = useId();
  const galleryForm = useId();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [itemDraft, setItemDraftState] = useState<ItemDraft | null>(null);
  const [galleryDraft, setGalleryDraftState] = useState<GalleryDraft | null>(null);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);

  function setItemDraft(next: ItemDraft | null) {
    if (itemDraft?.picked && itemDraft.picked !== next?.picked) release(itemDraft.picked);
    setItemDraftState(next);
  }

  function setGalleryDraft(next: GalleryDraft | null) {
    if (galleryDraft?.topic !== next?.topic) release(galleryDraft?.topic ?? null);
    if (galleryDraft?.shot !== next?.shot) release(galleryDraft?.shot ?? null);
    setGalleryDraftState(next);
  }

  // 保存・削除の共通処理。サーバーの結果にエラーがあれば知らせ、なければ読み直す。
  async function run(
    task: () => Promise<{ error?: string | null } | void>,
    done: string,
    onDone?: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      const result = await task();
      if (result?.error) {
        setFormError(result.error);
        toast.show({ title: result.error });
        return;
      }
      await onChanged();
      onDone?.();
      toast.show({ title: done });
    } catch (caught) {
      setFormError(errorMessage(caught));
      toast.show({ title: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  }

  async function pickInto(file: File, apply: (image: PickedImage) => void) {
    try {
      apply(await pick(file));
      setFormError(null);
    } catch (caught) {
      setFormError(errorMessage(caught));
    }
  }

  function saveItem() {
    if (!itemDraft) return;
    const parsed = v.safeParse(homeItemTextSchema, itemDraft);
    if (!parsed.success) {
      setFormError(parsed.issues[0].message);
      return;
    }
    const data = { id: itemDraft.item.id, ...parsed.output, removeImage: itemDraft.removeImage };
    void run(
      () => saveHomeItem({ data: contentForm(data, { image: itemDraft.picked?.blob ?? null }) }),
      "保存しました",
      () => setItemDraft(null),
    );
  }

  function saveGallery() {
    if (!galleryDraft) return;
    const parsed = v.safeParse(galleryItemTextSchema, {
      ...galleryDraft,
      score: toNumber(galleryDraft.score),
      metrics: Object.fromEntries(
        scoringMetrics.map((metric) => [metric.key, toNumber(galleryDraft.metrics[metric.key])]),
      ),
    });
    if (!parsed.success) {
      setFormError(parsed.issues[0].message);
      return;
    }
    if (galleryDraft.isNew && (!galleryDraft.topic || !galleryDraft.shot)) {
      setFormError("お題と提出の画像を選んでください。");
      return;
    }
    const data = { id: galleryDraft.id, ...parsed.output };
    void run(
      () =>
        saveGalleryItem({
          data: contentForm(data, {
            topic: galleryDraft.topic?.blob ?? null,
            shot: galleryDraft.shot?.blob ?? null,
          }),
        }),
      "保存しました",
      () => setGalleryDraft(null),
    );
  }

  function replaceOgImage(file: File) {
    void run(async () => {
      const blob = await toPng(file, ogImageSize);
      const form = new FormData();
      form.set("image", new File([blob], "og-image.png", { type: "image/png" }));
      return saveOgImage({ data: form });
    }, "OGP画像を保存しました");
  }

  const editItem = (item: HomeItem) => {
    setFormError(null);
    setItemDraft({
      item,
      title: item.title,
      description: item.description,
      picked: null,
      removeImage: false,
    });
  };
  const itemPreview = itemDraft
    ? (itemDraft.picked?.url ?? (itemDraft.removeImage ? null : itemDraft.item.image))
    : null;

  return (
    <Stack>
      <AdminHead
        eyebrow="Admin"
        title="トップページ"
        description="トップページの遊び方・採点方法・ギャラリーと、共有したときに出るOGP画像です。変えた内容は、次にトップページを開いたときから出ます。"
      />

      <section aria-label="遊び方">
        <Stack space="compact">
          <Heading level={2} size="sm">
            遊び方
          </Heading>
          <Grid columns={4} space="compact">
            {content.howSteps.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                label={`手順${index + 1}`}
                busy={busy}
                onEdit={() => editItem(item)}
              />
            ))}
          </Grid>
        </Stack>
      </section>

      <section aria-label="採点方法">
        <Stack space="compact">
          <Heading level={2} size="sm">
            採点方法
          </Heading>
          <Text variant="body.sm" tone="muted">
            1つ目の項目のグラフには、「採点の重み」で保存した今の重みを出します。
          </Text>
          <Grid columns={3} space="compact">
            {content.scoringSteps.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                label={`項目${index + 1}`}
                busy={busy}
                onEdit={() => editItem(item)}
              />
            ))}
          </Grid>
        </Stack>
      </section>

      <section aria-label="ギャラリー">
        <Stack space="compact">
          <Cluster justify="between">
            <Heading level={2} size="sm">
              ギャラリー（{content.gallery.length}件）
            </Heading>
            <Button
              appearance="secondary"
              size="sm"
              loading={busy}
              onClick={() => {
                setFormError(null);
                setGalleryDraft(toGalleryDraft(null));
              }}
            >
              例を追加
            </Button>
          </Cluster>
          {content.gallery.length === 0 && (
            <Text tone="muted">例がありません。トップページには案内だけを出します</Text>
          )}
          <Grid columns={3} space="compact">
            {content.gallery.map((item, index) => (
              <Surface key={item.id} appearance="card" padding="content">
                <Stack space="compact">
                  <Grid columns={2} space="compact" collapse="none">
                    <Media src={item.topicSrc} alt={item.topicAlt} aspect="portrait" fit="cover" />
                    <Media src={item.shotSrc} alt={item.shotAlt} aspect="portrait" fit="cover" />
                  </Grid>
                  <Text variant="body.sm">
                    {`${index + 1}. ${getDifficulty(item.difficulty).label}・再現度 ${item.score.toFixed(1)}`}
                  </Text>
                  <Cluster justify="between">
                    <Cluster layout="nowrap">
                      <IconButton
                        label={`${index + 1}件目を前へ`}
                        appearance="quiet"
                        size="sm"
                        disabled={index === 0}
                        loading={busy}
                        onClick={() =>
                          void run(
                            () => moveGalleryItem({ data: { id: item.id, direction: "up" } }),
                            "並べ替えました",
                          )
                        }
                      >
                        ←
                      </IconButton>
                      <IconButton
                        label={`${index + 1}件目を後ろへ`}
                        appearance="quiet"
                        size="sm"
                        disabled={index === content.gallery.length - 1}
                        loading={busy}
                        onClick={() =>
                          void run(
                            () => moveGalleryItem({ data: { id: item.id, direction: "down" } }),
                            "並べ替えました",
                          )
                        }
                      >
                        →
                      </IconButton>
                    </Cluster>
                    <Cluster>
                      <Button
                        appearance="secondary"
                        size="sm"
                        loading={busy}
                        onClick={() => {
                          setFormError(null);
                          setGalleryDraft(toGalleryDraft(item));
                        }}
                      >
                        {`${index + 1}件目を編集`}
                      </Button>
                      <Button
                        appearance="quiet"
                        size="sm"
                        loading={busy}
                        onClick={() => setDeleting(item)}
                      >
                        {`${index + 1}件目を削除`}
                      </Button>
                    </Cluster>
                  </Cluster>
                </Stack>
              </Surface>
            ))}
          </Grid>
        </Stack>
      </section>

      <section aria-label="OGP画像">
        <Stack space="compact">
          <Heading level={2} size="sm">
            OGP画像
          </Heading>
          <Media
            src={content.ogImage ?? "/og-image.png"}
            alt="今のOGP画像"
            aspect="landscape"
            fit="contain"
          />
          <Text variant="body.sm" tone="muted">
            {content.ogImage
              ? "登録した画像を出しています。"
              : "画像を登録していないため、既定の画像（public/og-image.png）を出しています。"}
            {` ${ogImageSize.width}×${ogImageSize.height}の画像を選んでください（PNG・WebP・JPEG、10MBまで）。PNGに変換して保存します。SNSが取得済みの画像は、各サービスのキャッシュが切れるまで前の画像のままです。`}
          </Text>
          <Cluster>
            <FileButton
              label="OGP画像を選ぶ"
              accept={sourceImageTypes.join(",")}
              loading={busy}
              onFile={replaceOgImage}
            />
            {content.ogImage && (
              <Button
                appearance="quiet"
                size="sm"
                loading={busy}
                onClick={() => void run(() => deleteOgImage(), "既定のOGP画像に戻しました")}
              >
                既定の画像に戻す
              </Button>
            )}
          </Cluster>
        </Stack>
      </section>

      <Dialog
        size="compact"
        presentation="centered"
        open={itemDraft !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setItemDraft(null);
        }}
        dismissible={!busy}
        closeButton={!busy}
        title="項目を編集"
        footer={
          <Cluster justify="end">
            <Button appearance="secondary" loading={busy} onClick={() => setItemDraft(null)}>
              やめる
            </Button>
            <Button form={itemForm} type="submit" loading={busy}>
              保存する
            </Button>
          </Cluster>
        }
      >
        {itemDraft && (
          <form
            id={itemForm}
            onSubmit={(event) => {
              event.preventDefault();
              saveItem();
            }}
          >
            <Stack>
              <Field label="題名" description="30文字まで">
                <Input
                  value={itemDraft.title}
                  maxLength={30}
                  disabled={busy}
                  onChange={(event) => setItemDraft({ ...itemDraft, title: event.target.value })}
                />
              </Field>
              <Field label="本文" description="200文字まで">
                <Textarea
                  value={itemDraft.description}
                  maxLength={200}
                  disabled={busy}
                  onChange={(event) =>
                    setItemDraft({ ...itemDraft, description: event.target.value })
                  }
                />
              </Field>
              <ImageField
                label="画像"
                preview={itemPreview}
                busy={busy}
                note="PNG・WebP・JPEG（10MBまで）。枠に合わせて中央を切り抜いて出します。外すと既定の絵に戻ります"
                fallback={<DefaultArtwork id={itemDraft.item.id} />}
                onPick={(file) =>
                  void pickInto(file, (image) =>
                    setItemDraft({ ...itemDraft, picked: image, removeImage: false }),
                  )
                }
                onRemove={() => setItemDraft({ ...itemDraft, picked: null, removeImage: true })}
              />
              {formError && <Text tone="danger">{formError}</Text>}
            </Stack>
          </form>
        )}
      </Dialog>

      <Dialog
        size="compact"
        presentation="centered"
        open={galleryDraft !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setGalleryDraft(null);
        }}
        dismissible={!busy}
        closeButton={!busy}
        title={galleryDraft?.isNew ? "ギャラリーの例を追加" : "ギャラリーの例を編集"}
        footer={
          <Cluster justify="end">
            <Button appearance="secondary" loading={busy} onClick={() => setGalleryDraft(null)}>
              やめる
            </Button>
            <Button form={galleryForm} type="submit" loading={busy}>
              保存する
            </Button>
          </Cluster>
        }
      >
        {galleryDraft && (
          <form
            id={galleryForm}
            onSubmit={(event) => {
              event.preventDefault();
              saveGallery();
            }}
          >
            <Stack>
              <SegmentedControl
                label="難易度"
                labelVisibility="visible"
                appearance="chips"
                value={galleryDraft.difficulty}
                disabled={busy}
                options={DIFFICULTIES.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => {
                  const difficulty = v.safeParse(difficultySchema, value);
                  if (difficulty.success)
                    setGalleryDraft({ ...galleryDraft, difficulty: difficulty.output });
                }}
              />
              <Field label="再現度" description="0〜100（小数第1位まで出します）">
                <Input
                  inputMode="decimal"
                  value={galleryDraft.score}
                  disabled={busy}
                  onChange={(event) =>
                    setGalleryDraft({ ...galleryDraft, score: event.target.value })
                  }
                />
              </Field>
              <Grid columns={2} space="compact">
                {scoringMetrics.map((metric) => (
                  <Field key={metric.key} label={metric.label} description="0〜100">
                    <Input
                      inputMode="decimal"
                      value={galleryDraft.metrics[metric.key]}
                      disabled={busy}
                      onChange={(event) =>
                        setGalleryDraft({
                          ...galleryDraft,
                          metrics: { ...galleryDraft.metrics, [metric.key]: event.target.value },
                        })
                      }
                    />
                  </Field>
                ))}
              </Grid>
              <ImageField
                label="お題の画像"
                preview={galleryDraft.topic?.url ?? galleryDraft.topicSrc}
                busy={busy}
                note="PNG・WebP・JPEG（10MBまで）"
                onPick={(file) =>
                  void pickInto(file, (image) => setGalleryDraft({ ...galleryDraft, topic: image }))
                }
              />
              <Field label="お題の画像の説明" description="読み上げに使います。100文字まで">
                <Input
                  value={galleryDraft.topicAlt}
                  maxLength={100}
                  disabled={busy}
                  onChange={(event) =>
                    setGalleryDraft({ ...galleryDraft, topicAlt: event.target.value })
                  }
                />
              </Field>
              <ImageField
                label="提出の画像"
                preview={galleryDraft.shot?.url ?? galleryDraft.shotSrc}
                busy={busy}
                note="PNG・WebP・JPEG（10MBまで）"
                onPick={(file) =>
                  void pickInto(file, (image) => setGalleryDraft({ ...galleryDraft, shot: image }))
                }
              />
              <Field label="提出の画像の説明" description="読み上げに使います。100文字まで">
                <Input
                  value={galleryDraft.shotAlt}
                  maxLength={100}
                  disabled={busy}
                  onChange={(event) =>
                    setGalleryDraft({ ...galleryDraft, shotAlt: event.target.value })
                  }
                />
              </Field>
              {formError && <Text tone="danger">{formError}</Text>}
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
        title="ギャラリーの例を削除しますか？"
        description="登録した画像も消えます。"
        footer={
          <Cluster justify="end">
            <Button appearance="secondary" loading={busy} onClick={() => setDeleting(null)}>
              やめる
            </Button>
            <Button
              loading={busy}
              onClick={() => {
                if (deleting)
                  void run(
                    () => deleteGalleryItem({ data: { id: deleting.id } }),
                    "削除しました",
                    () => setDeleting(null),
                  );
              }}
            >
              削除する
            </Button>
          </Cluster>
        }
      >
        {deleting && (
          <Text>{`${getDifficulty(deleting.difficulty).label}・再現度 ${deleting.score.toFixed(1)}`}</Text>
        )}
      </Dialog>
    </Stack>
  );
}
