import { parseTopicImageKey, topicImagePath } from "../battle/topic-images";
import { phraseImagePath } from "../image-generation/phrase-images";
import {
  backupFileName,
  backupImagePath,
  backupPhraseImagePath,
  buildBackupZip,
  chunks,
  readBackupZip,
  summarizeBackup,
} from "./backup";
import type { Backup, BackupPhraseImage, BackupSummary } from "./backup";
import {
  applyBackupChunk,
  getBackup,
  putBackupImage,
  putBackupPhraseImage,
} from "./backup.functions";

// ZIPの作成と展開はブラウザーで行う。サーバー（Workers）のCPU時間とメモリに収めるため。

/** 進み具合（終わった数と全体の数）を受け取る。 */
export type BackupProgress = (done: number, total: number) => void;

/** 書き出すZIPを作る。お題の画像と挿絵は配信URLから読む。 */
export async function createBackupFile(onProgress?: BackupProgress) {
  const backup = await getBackup();
  const keyed = backup.topics.filter((topic) => topic.imageKey !== null);
  const illustrated = backup.promptGroups.flatMap((group) =>
    group.phrases.flatMap((phrase) =>
      phrase.imageId ? [{ label: phrase.label, phraseId: phrase.id, imageId: phrase.imageId }] : [],
    ),
  );
  const total = keyed.length + illustrated.length;
  const images = new Map<string, Uint8Array>();
  for (const [index, topic] of keyed.entries()) {
    const id = topic.imageKey ? parseTopicImageKey(topic.imageKey) : null;
    const path = topic.imageKey ? backupImagePath(topic.imageKey) : null;
    if (!id || !path) throw new Error(`お題「${topic.id}」の画像のキーが正しくありません。`);
    const response = await fetch(topicImagePath(id));
    if (!response.ok)
      throw new Error(`お題「${topic.id}」の画像を読めませんでした（HTTP ${response.status}）。`);
    images.set(path, new Uint8Array(await response.arrayBuffer()));
    onProgress?.(index + 1, total);
  }
  for (const [index, { label, ...id }] of illustrated.entries()) {
    const response = await fetch(phraseImagePath(id));
    if (!response.ok)
      throw new Error(`表現「${label}」の挿絵を読めませんでした（HTTP ${response.status}）。`);
    images.set(backupPhraseImagePath(id), new Uint8Array(await response.arrayBuffer()));
    onProgress?.(keyed.length + index + 1, total);
  }
  return {
    fileName: backupFileName(new Date()),
    blob: new Blob([new Uint8Array(buildBackupZip(backup, images))], { type: "application/zip" }),
    topics: backup.topics.length,
  };
}

export type OpenedBackup = {
  backup: Backup;
  images: Map<string, Uint8Array>;
  phraseImages: BackupPhraseImage[];
  summary: BackupSummary;
};

/** 選んだZIPを開いて確かめ、読み込むと追加・上書きされる件数を数える。何も書き込まない。 */
export async function openBackupFile(
  file: File,
): Promise<{ opened: OpenedBackup; error: null } | { opened: null; error: string }> {
  const read = readBackupZip(new Uint8Array(await file.arrayBuffer()));
  if (read.error !== null) return { opened: null, error: read.error };
  const current = await getBackup();
  return {
    opened: {
      backup: read.backup,
      images: read.images,
      phraseImages: read.phraseImages,
      summary: summarizeBackup(current, read.backup),
    },
    error: null,
  };
}

/** 読み込む項目。選ばなかった項目は書き込まない。 */
export type BackupSelection = {
  topics: boolean;
  battleOptions: boolean;
  promptDictionary: boolean;
};

async function apply(data: Parameters<typeof applyBackupChunk>[0]["data"]) {
  const { error } = await applyBackupChunk({ data });
  if (error) throw new Error(error);
}

/**
 * 開いたZIPのうち、選んだ項目を書き込む。画像・挿絵・グループ・表現・お題・対戦条件の順に、少しずつ送る。
 * 途中で失敗しても、同じZIPを同じ項目で読み込み直せば同じ状態になる。
 */
export async function applyBackupFile(
  { backup, images, phraseImages }: OpenedBackup,
  selection: BackupSelection,
  onProgress?: BackupProgress,
) {
  const dictionary = selection.promptDictionary ? backup.promptGroups : [];
  const topicImages = selection.topics ? [...images] : [];
  const illustrations = selection.promptDictionary ? phraseImages : [];
  const groups = chunks(dictionary.map(({ phrases: _phrases, ...group }) => group));
  const phrases = chunks(
    dictionary.flatMap((group) => group.phrases.map((phrase) => ({ groupId: group.id, phrase }))),
  );
  const topics = chunks(selection.topics ? backup.topics : []);
  const total =
    topicImages.length +
    illustrations.length +
    groups.length +
    phrases.length +
    topics.length +
    Number(selection.battleOptions);
  let done = 0;
  const step = () => onProgress?.(++done, total);

  for (const [key, bytes] of topicImages) {
    const form = new FormData();
    form.set("key", key);
    form.set("file", new File([new Uint8Array(bytes)], "image.webp", { type: "image/webp" }));
    const { error } = await putBackupImage({ data: form });
    if (error) throw new Error(`画像（${key}）を保存できませんでした: ${error}`);
    step();
  }
  for (const { phraseId, imageId, bytes } of illustrations) {
    const form = new FormData();
    form.set("phraseId", phraseId);
    form.set("imageId", imageId);
    form.set("file", new File([new Uint8Array(bytes)], "image.webp", { type: "image/webp" }));
    const { error } = await putBackupPhraseImage({ data: form });
    if (error) throw new Error(`挿絵（${phraseId}）を保存できませんでした: ${error}`);
    step();
  }
  for (const promptGroups of groups) {
    await apply({ promptGroups });
    step();
  }
  for (const promptPhrases of phrases) {
    await apply({ promptPhrases });
    step();
  }
  for (const chunk of topics) {
    await apply({ topics: chunk });
    step();
  }
  if (selection.battleOptions) {
    await apply({ battleOptions: backup.battleOptions });
    step();
  }
}
