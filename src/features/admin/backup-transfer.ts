import { parseTopicImageKey, topicImagePath } from "../battle/topic-images";
import {
  backupFileName,
  backupImagePath,
  buildBackupZip,
  chunks,
  readBackupZip,
  summarizeBackup,
} from "./backup";
import type { Backup, BackupSummary } from "./backup";
import { applyBackupChunk, getBackup, putBackupImage } from "./backup.functions";

// ZIPの作成と展開はブラウザーで行う。サーバー（Workers）のCPU時間とメモリに収めるため。

/** 進み具合（終わった数と全体の数）を受け取る。 */
export type BackupProgress = (done: number, total: number) => void;

/** 書き出すZIPを作る。画像は配信URLから読む。 */
export async function createBackupFile(onProgress?: BackupProgress) {
  const backup = await getBackup();
  const keyed = backup.topics.filter((topic) => topic.imageKey !== null);
  const images = new Map<string, Uint8Array>();
  for (const [index, topic] of keyed.entries()) {
    const id = topic.imageKey ? parseTopicImageKey(topic.imageKey) : null;
    const path = topic.imageKey ? backupImagePath(topic.imageKey) : null;
    if (!id || !path) throw new Error(`お題「${topic.id}」の画像のキーが正しくありません。`);
    const response = await fetch(topicImagePath(id));
    if (!response.ok)
      throw new Error(`お題「${topic.id}」の画像を読めませんでした（HTTP ${response.status}）。`);
    images.set(path, new Uint8Array(await response.arrayBuffer()));
    onProgress?.(index + 1, keyed.length);
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
      summary: summarizeBackup(current, read.backup),
    },
    error: null,
  };
}

async function apply(data: Parameters<typeof applyBackupChunk>[0]["data"]) {
  const { error } = await applyBackupChunk({ data });
  if (error) throw new Error(error);
}

/**
 * 開いたZIPの内容を書き込む。画像・グループ・表現・お題・対戦条件の順に、少しずつ送る。
 * 途中で失敗しても、同じZIPを読み込み直せば同じ状態になる。
 */
export async function applyBackupFile(
  { backup, images }: OpenedBackup,
  onProgress?: BackupProgress,
) {
  const groups = chunks(backup.promptGroups.map(({ phrases: _phrases, ...group }) => group));
  const phrases = chunks(
    backup.promptGroups.flatMap((group) =>
      group.phrases.map((phrase) => ({ groupId: group.id, phrase })),
    ),
  );
  const topics = chunks(backup.topics);
  const total = images.size + groups.length + phrases.length + topics.length + 1;
  let done = 0;
  const step = () => onProgress?.(++done, total);

  for (const [key, bytes] of images) {
    const form = new FormData();
    form.set("key", key);
    form.set("file", new File([new Uint8Array(bytes)], "image.webp", { type: "image/webp" }));
    const { error } = await putBackupImage({ data: form });
    if (error) throw new Error(`画像（${key}）を保存できませんでした: ${error}`);
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
  await apply({ battleOptions: backup.battleOptions });
  step();
}
