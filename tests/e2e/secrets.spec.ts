import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { e2eNovelAiToken } from "./novelai-token";

test("ブラウザへ配信するファイルとページにNovelAIのトークンを含めない", async ({ request }) => {
  const dist = new URL("../../dist/", import.meta.url);
  // サーバー側には渡っていることを確かめ、検索する文字列がビルドの値と一致していることを保証する。
  expect(await readFile(new URL("server/.dev.vars", dist), "utf8")).toContain(e2eNovelAiToken);
  const files = (
    await readdir(fileURLToPath(new URL("client/", dist)), { recursive: true, withFileTypes: true })
  ).filter((entry) => entry.isFile());
  expect(files.length).toBeGreaterThan(0);
  const leaked: string[] = [];
  for (const file of files) {
    const path = join(file.parentPath, file.name);
    if ((await readFile(path, "utf8")).includes(e2eNovelAiToken)) leaked.push(path);
  }
  expect(leaked).toEqual([]);
  expect(await (await request.get("/")).text()).not.toContain(e2eNovelAiToken);
});
