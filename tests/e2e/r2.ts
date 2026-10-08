import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** E2E用のローカルR2から、お題の画像を1つ消す。 */
export async function deleteLocalTopicImage(key: string) {
  await execFileAsync("vp", [
    "exec",
    "wrangler",
    "r2",
    "object",
    "delete",
    `animic-topic-images/${key}`,
    "--local",
    "--persist-to",
    ".wrangler/e2e",
  ]);
}
