import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { e2eNovelAiToken } from "./novelai-token";
import { e2eOAuthClients } from "./oauth-clients";
import { e2eDiscordBotToken } from "./fake-discord";

const secrets = [
  e2eNovelAiToken,
  e2eOAuthClients.google.secret,
  e2eOAuthClients.discord.secret,
  e2eDiscordBotToken,
];

test("ブラウザへ配信するファイルとページにNovelAIのトークンとOAuthの秘密情報を含めない", async ({
  request,
}) => {
  const dist = new URL("../../dist/", import.meta.url);
  // サーバー側には渡っていることを確かめ、検索する文字列がビルドの値と一致していることを保証する。
  const vars = await readFile(new URL("server/.dev.vars", dist), "utf8");
  // Activitiesは任意のsecretなので、E2EビルドだけのWorker varsにBotのテスト値を渡す。
  const config = await readFile(new URL("server/wrangler.json", dist), "utf8");
  for (const secret of secrets) expect(vars + config).toContain(secret);
  const files = (
    await readdir(fileURLToPath(new URL("client/", dist)), { recursive: true, withFileTypes: true })
  ).filter((entry) => entry.isFile());
  expect(files.length).toBeGreaterThan(0);
  const leaked: string[] = [];
  for (const file of files) {
    const path = join(file.parentPath, file.name);
    const content = await readFile(path, "utf8");
    if (secrets.some((secret) => content.includes(secret))) leaked.push(path);
  }
  expect(leaked).toEqual([]);
  const html = await (await request.get("/")).text();
  for (const secret of secrets) expect(html).not.toContain(secret);
});
