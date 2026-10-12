import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function deleteLocalObject(bucket: string, key: string) {
  await execFileAsync("vp", [
    "exec",
    "wrangler",
    "r2",
    "object",
    "delete",
    `${bucket}/${key}`,
    "--local",
    "--persist-to",
    ".wrangler/e2e",
  ]);
}

/** E2E用のローカルR2から、お題の画像を1つ消す。 */
export async function deleteLocalTopicImage(key: string) {
  await deleteLocalObject("animic-topic-images", key);
}

/** E2E用のローカルR2から、表現の挿絵を1つ消す。 */
export async function deleteLocalPhraseImage(key: string) {
  await deleteLocalObject("animic-phrase-images", key);
}
