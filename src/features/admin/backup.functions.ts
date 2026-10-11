import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, inArray, isNotNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import { adminTopicSchema } from "../battle/topic-admin";
import { parseTopicImageKey } from "../battle/topic-images";
import { hasTopicImage, putTopicImage, topicImageUrl } from "../battle/topic-images.server";
import { loadAllTopics, upsertTopic } from "../battle/topics.server";
import {
  deleteUnusedPhraseImages,
  hasPhraseImage,
  putPhraseImage,
} from "../image-generation/phrase-images.server";
import {
  phraseImageIdSchema,
  promptGroupSchema,
  promptIdSchema,
  promptPhraseSchema,
} from "../image-generation/prompt-phrases";
import { promptPhrase } from "../image-generation/prompt-phrases.schema";
import {
  loadPromptGroups,
  upsertPromptGroup,
  upsertPromptPhrase,
} from "../image-generation/prompt-phrases.server";
import { battleOptionsSchema } from "../room/battle-options";
import { loadBattleOptions, replaceBattleOptions } from "../room/battle-options.server";
import { backupChunkSize, backupFormat } from "./backup";
import type { Backup } from "./backup";

/** 書き出す内容（お題・対戦条件・表現の辞書）。画像はブラウザーが配信URLから読んでZIPに入れる。 */
export const getBackup = createServerFn({ method: "GET" }).handler(async (): Promise<Backup> => {
  requireAdmin();
  const [topics, battleOptions, promptGroups] = await Promise.all([
    loadAllTopics(env.DB),
    loadBattleOptions(env.DB),
    loadPromptGroups(env.DB),
  ]);
  return {
    format: backupFormat,
    exportedAt: new Date().toISOString(),
    topics,
    battleOptions,
    promptGroups,
  };
});

/** 読み込むお題の画像を1枚保存する。同じキーの画像がすでにあれば保存し直さない。 */
export const putBackupImage = createServerFn({ method: "POST" })
  .validator((form: unknown) => {
    if (!(form instanceof FormData)) throw new Error("フォームの形式が正しくありません。");
    const key = form.get("key");
    const file = form.get("file");
    return { key: typeof key === "string" ? key : "", file: file instanceof File ? file : null };
  })
  .handler(async ({ data }) => {
    requireAdmin();
    const id = parseTopicImageKey(data.key);
    if (!id) return { error: "画像のキーが正しくありません。" };
    if (await hasTopicImage(data.key)) return { error: null };
    if (!data.file) return { error: "画像がありません。" };
    return { error: await putTopicImage(id, new Uint8Array(await data.file.arrayBuffer())) };
  });

/** 読み込む挿絵を1枚保存する。同じ表現・画像IDの挿絵がすでにあれば保存し直さない。 */
export const putBackupPhraseImage = createServerFn({ method: "POST" })
  .validator((form: unknown) => {
    if (!(form instanceof FormData)) throw new Error("フォームの形式が正しくありません。");
    const text = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };
    const file = form.get("file");
    return {
      phraseId: text("phraseId"),
      imageId: text("imageId"),
      file: file instanceof File ? file : null,
    };
  })
  .handler(async ({ data }) => {
    requireAdmin();
    const phraseId = v.safeParse(promptIdSchema, data.phraseId);
    const imageId = v.safeParse(phraseImageIdSchema, data.imageId);
    if (!phraseId.success || !imageId.success) return { error: "挿絵のIDが正しくありません。" };
    const id = { phraseId: phraseId.output, imageId: imageId.output };
    if (await hasPhraseImage(id)) return { error: null };
    if (!data.file) return { error: "画像がありません。" };
    return { error: await putPhraseImage(id, new Uint8Array(await data.file.arrayBuffer())) };
  });

const chunkSchema = <T extends v.GenericSchema>(item: T) =>
  v.optional(v.pipe(v.array(item), v.maxLength(backupChunkSize)), []);

/**
 * 読み込む内容の一部を書き込む。同じIDは上書き、ないものは追加し、削除はしない。
 * D1の1回の呼び出しで使えるクエリ数に収めるため、ブラウザーが分けて呼ぶ。
 * 先にグループ、次に表現、画像を保存した後にお題の順で呼ぶ。挿絵は表現より先に保存する。
 * 表現を上書きして使わなくなった挿絵は消す。
 */
export const applyBackupChunk = createServerFn({ method: "POST" })
  .validator(
    v.object({
      topics: chunkSchema(adminTopicSchema),
      promptGroups: chunkSchema(v.omit(promptGroupSchema, ["phrases"])),
      promptPhrases: chunkSchema(v.object({ groupId: v.string(), phrase: promptPhraseSchema })),
      battleOptions: v.optional(v.nullable(battleOptionsSchema), null),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin();
    const db = drizzle(env.DB);
    const topics = [];
    for (const item of data.topics) {
      let imageUrl = item.imageUrl;
      if (item.imageKey !== null) {
        const id = parseTopicImageKey(item.imageKey);
        if (!id || id.topicId !== item.id)
          return { error: `お題「${item.id}」の画像のキーが正しくありません。` };
        if (!(await hasTopicImage(item.imageKey)))
          return { error: `お題「${item.id}」の画像が保存されていません。` };
        imageUrl = topicImageUrl(id);
      }
      topics.push(upsertTopic(env.DB, { ...item, imageUrl }));
    }
    for (const { phrase } of data.promptPhrases)
      if (
        phrase.imageId !== null &&
        !(await hasPhraseImage({ phraseId: phrase.id, imageId: phrase.imageId }))
      )
        return { error: `表現「${phrase.label}」の挿絵が保存されていません。` };
    // 同じIDの表現と、同じグループの表現（同じ語なら置き換わる）の挿絵を、書き込む前に控える。
    const replaced = data.promptPhrases.length
      ? await db
          .select({ phraseId: promptPhrase.id, imageId: promptPhrase.imageId })
          .from(promptPhrase)
          .where(
            and(
              isNotNull(promptPhrase.imageId),
              or(
                inArray(
                  promptPhrase.id,
                  data.promptPhrases.map(({ phrase }) => phrase.id),
                ),
                inArray(promptPhrase.groupId, [
                  ...new Set(data.promptPhrases.map(({ groupId }) => groupId)),
                ]),
              ),
            ),
          )
      : [];
    const writes = [
      ...data.promptGroups.map((group) => upsertPromptGroup(env.DB, group)),
      ...data.promptPhrases.flatMap(({ groupId, phrase }) =>
        upsertPromptPhrase(env.DB, groupId, phrase),
      ),
      ...topics,
    ];
    const [first, ...rest] = writes;
    if (first) await db.batch([first, ...rest]);
    await deleteUnusedPhraseImages(replaced);
    if (data.battleOptions) await replaceBattleOptions(env.DB, data.battleOptions);
    return { error: null };
  });
