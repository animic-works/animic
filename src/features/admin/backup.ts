import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import * as v from "valibot";

import { adminTopicSchema } from "../battle/topic-admin";
import { parseTopicImageKey } from "../battle/topic-images";
import type { PhraseImageId } from "../image-generation/phrase-images";
import { promptGroupSchema } from "../image-generation/prompt-phrases";
import { battleOptionsSchema } from "../room/battle-options";

export const backupFormat = "animic-backup/1";
const dataFileName = "backup.json";

const backupSchema = v.object({
  format: v.literal(backupFormat, "Animicのバックアップ（animic-backup/1）ではありません。"),
  exportedAt: v.string(),
  topics: v.pipe(v.array(adminTopicSchema), v.maxLength(10_000)),
  battleOptions: battleOptionsSchema,
  promptGroups: v.pipe(v.array(promptGroupSchema), v.maxLength(200)),
});
export type Backup = v.InferOutput<typeof backupSchema>;

/** 1回のServer Functionで書き込む件数。D1の1回の呼び出しあたりのクエリ数の上限に収める。 */
export const backupChunkSize = 20;

/** ZIPの中の画像のパス（`topic-images/<お題ID>/<画像ID>.webp`）。R2のキーが形式どおりでなければnull。 */
export function backupImagePath(imageKey: string) {
  const id = parseTopicImageKey(imageKey);
  return id ? `topic-images/${id.topicId}/${id.imageId}.webp` : null;
}

/** ZIPの中の挿絵のパス（`phrase-images/<表現ID>/<画像ID>.webp`）。 */
export function backupPhraseImagePath({ phraseId, imageId }: PhraseImageId) {
  return `phrase-images/${phraseId}/${imageId}.webp`;
}

/** 書き出すZIPのファイル名（日本時間の日時）。 */
export function backupFileName(now: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(now)
    .replaceAll(/\D/g, "");
  return `animic-backup-${parts.slice(0, 8)}-${parts.slice(8)}.zip`;
}

/** バックアップのZIPを作る。WebPは圧縮済みのため、画像は圧縮せずに格納する。 */
export function buildBackupZip(backup: Backup, images: ReadonlyMap<string, Uint8Array>) {
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
    [dataFileName]: strToU8(JSON.stringify(backup, null, 2)),
  };
  for (const [path, bytes] of images) files[path] = [bytes, { level: 0 }];
  return zipSync(files);
}

/** ZIPから読んだ挿絵。 */
export type BackupPhraseImage = PhraseImageId & { bytes: Uint8Array };

export type ReadBackupResult =
  | {
      backup: Backup;
      images: Map<string, Uint8Array>;
      phraseImages: BackupPhraseImage[];
      error: null;
    }
  | { backup: null; images: null; phraseImages: null; error: string };

const failed = (error: string) =>
  ({ backup: null, images: null, phraseImages: null, error }) as const;

/** ZIPを開いて中身を確かめる。お題の画像や挿絵がそろっていなければ理由を返す。 */
export function readBackupZip(bytes: Uint8Array): ReadBackupResult {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    return failed("ZIPファイルを開けませんでした。");
  }
  const data = files[dataFileName];
  if (!data) return failed(`ZIPに${dataFileName}がありません。`);
  let json: unknown;
  try {
    json = JSON.parse(strFromU8(data));
  } catch {
    return failed(`${dataFileName}を読めませんでした。`);
  }
  const parsed = v.safeParse(backupSchema, json);
  if (!parsed.success) {
    const [issue] = parsed.issues;
    const path = v.getDotPath(issue);
    return failed(path ? `${issue.message}（${path}）` : issue.message);
  }
  const images = new Map<string, Uint8Array>();
  for (const topic of parsed.output.topics) {
    if (topic.imageKey === null) continue;
    const id = parseTopicImageKey(topic.imageKey);
    const path = backupImagePath(topic.imageKey);
    if (!id || !path || id.topicId !== topic.id)
      return failed(`お題「${topic.id}」の画像のキーが正しくありません。`);
    const image = files[path];
    if (!image) return failed(`お題「${topic.id}」の画像がZIPにありません。`);
    images.set(topic.imageKey, image);
  }
  const phraseImages: BackupPhraseImage[] = [];
  for (const phrase of parsed.output.promptGroups.flatMap((group) => group.phrases)) {
    if (phrase.imageId === null) continue;
    const id = { phraseId: phrase.id, imageId: phrase.imageId };
    const image = files[backupPhraseImagePath(id)];
    if (!image) return failed(`表現「${phrase.label}」の挿絵がZIPにありません。`);
    phraseImages.push({ ...id, bytes: image });
  }
  return { backup: parsed.output, images, phraseImages, error: null };
}

type BackupCounts = { added: number; updated: number };
export type BackupSummary = {
  topics: BackupCounts;
  promptGroups: BackupCounts;
  promptPhrases: BackupCounts;
};

function count<T>(items: readonly T[], exists: (item: T) => boolean): BackupCounts {
  const updated = items.filter(exists).length;
  return { added: items.length - updated, updated };
}

/** 読み込むと追加・上書きされる件数。表現は、同じグループに同じ語があるものも上書きとして数える。 */
export function summarizeBackup(current: Backup, incoming: Backup): BackupSummary {
  const topicIds = new Set(current.topics.map((topic) => topic.id));
  const groupIds = new Set(current.promptGroups.map((group) => group.id));
  const currentPhrases = current.promptGroups.flatMap((group) =>
    group.phrases.map((phrase) => ({ groupId: group.id, ...phrase })),
  );
  const incomingPhrases = incoming.promptGroups.flatMap((group) =>
    group.phrases.map((phrase) => ({ groupId: group.id, ...phrase })),
  );
  return {
    topics: count(incoming.topics, (topic) => topicIds.has(topic.id)),
    promptGroups: count(incoming.promptGroups, (group) => groupIds.has(group.id)),
    promptPhrases: count(incomingPhrases, (phrase) =>
      currentPhrases.some(
        (item) =>
          item.id === phrase.id || (item.groupId === phrase.groupId && item.tag === phrase.tag),
      ),
    ),
  };
}

/** 配列を`size`件ずつに分ける。 */
export function chunks<T>(items: readonly T[], size = backupChunkSize): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    result.push(items.slice(index, index + size));
  return result;
}
