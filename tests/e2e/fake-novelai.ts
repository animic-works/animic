import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { setTimeout } from "node:timers/promises";
import { crc32, deflateSync } from "node:zlib";

import { zipSync } from "fflate";
import * as v from "valibot";

import { e2eNovelAiToken } from "./novelai-token";

// E2EでNovelAIの代わりに画像を返すサーバー。playwright.config.tsのglobalSetupで起動し、
// E2Eのビルドの`NOVELAI_API_URL`をここへ向ける。

export const fakeNovelAiUrl = "http://127.0.0.1:4174";
/** プロンプトに含めると、失敗（500）を返す。 */
export const novelAiFailMarker = "e2e-novelai-fail";
/** プロンプトに含めると、応答を3秒遅らせる。 */
export const novelAiSlowMarker = "e2e-novelai-slow";

const requestSchema = v.object({ input: v.string() });
const callsSchema = v.object({ count: v.number(), maxConcurrent: v.number() });

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.byteLength);
  const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

// NovelAIと同じく、8bitのRGBAでテキストのチャンクにプロンプトを埋め込んだPNG。
function png(prompt: string) {
  const size = 8;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      rows.set([x * 32, y * 32, 160, 254], y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("tEXt", Buffer.from(`Comment\0${JSON.stringify({ prompt })}`, "utf8")),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function readBody(request: IncomingMessage) {
  const parts: Buffer[] = [];
  for await (const part of request) parts.push(Buffer.from(part));
  return Buffer.concat(parts).toString("utf8");
}

/** 偽のNovelAIを起動し、停止する関数を返す。 */
export default async function startFakeNovelAi() {
  const prompts: string[] = [];
  let active = 0;
  let maxConcurrent = 0;
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", fakeNovelAiUrl);
    if (request.method === "GET" && url.pathname === "/e2e/calls") {
      const prompt = url.searchParams.get("prompt") ?? "";
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          count: prompts.filter((item) => item.includes(prompt)).length,
          maxConcurrent,
        }),
      );
      return;
    }
    if (request.method !== "POST" || url.pathname !== "/ai/generate-image") {
      response.writeHead(404).end();
      return;
    }
    if (request.headers.authorization !== `Bearer ${e2eNovelAiToken}`) {
      response.writeHead(401, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ statusCode: 401, message: "Unauthorized" }));
      return;
    }
    const { input } = v.parse(requestSchema, JSON.parse(await readBody(request)));
    prompts.push(input);
    active += 1;
    maxConcurrent = Math.max(maxConcurrent, active);
    try {
      await setTimeout(input.includes(novelAiSlowMarker) ? 3000 : 300);
      if (input.includes(novelAiFailMarker)) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ statusCode: 500, message: "E2Eの失敗" }));
        return;
      }
      response.writeHead(200, { "Content-Type": "application/x-zip-compressed" });
      response.end(zipSync({ "image_0.png": png(input) }));
    } finally {
      active -= 1;
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(new URL(fakeNovelAiUrl).port), "127.0.0.1", resolve);
  });
  return () => new Promise<void>((resolve) => server.close(() => resolve()));
}

/** プロンプトに`prompt`を含む要求を受けた回数と、同時に処理した要求の最大数。 */
export async function getNovelAiCalls(prompt: string) {
  const response = await fetch(`${fakeNovelAiUrl}/e2e/calls?${new URLSearchParams({ prompt })}`);
  return v.parse(callsSchema, await response.json());
}
