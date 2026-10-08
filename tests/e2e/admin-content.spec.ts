import { readFile } from "node:fs/promises";
import { crc32, deflateSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { BattleSettings } from "../../src/features/battle/battle-state";
import { inspectTopicWebp, parseTopicImageUrl } from "../../src/features/battle/topic-images";
import { loginAdmin, openAdminMenu } from "./admin";
import { create, join, snapshot } from "./api";
import { executeLocalD1 } from "./d1";
import { deleteLocalTopicImage } from "./r2";

const origin = "http://127.0.0.1:4173";
// 匿名参加の回数制限をほかのファイルのテストと分ける。
test.use({ extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.28" } });

function pngChunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "latin1"), data])), 0);
  return Buffer.concat([head, data, crc]);
}

// NovelAIの画像と同じく、テキストのチャンク（Comment）にプロンプトを持つ半透明のPNG。
function pngWithPrompt(prompt: string) {
  const size = 8;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const row = [0, ...Array.from({ length: size }, () => [255, 64, 128, 96]).flat()];
  const pixels = Buffer.from(Array.from({ length: size }, () => row).flat());
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("tEXt", Buffer.from(`Comment\0${JSON.stringify({ prompt })}`, "latin1")),
    pngChunk("IDAT", deflateSync(pixels)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// チャンクの名前と大きさだけを持つWebP（中身は0）。サーバーの形式の確認に使う。
function riff(...chunks: [string, number][]) {
  const body = chunks.reduce((sum, [, size]) => sum + 8 + size + (size % 2), 0);
  const bytes = Buffer.alloc(12 + body);
  bytes.write("RIFF", 0, "latin1");
  bytes.writeUInt32LE(4 + body, 4);
  bytes.write("WEBP", 8, "latin1");
  let offset = 12;
  for (const [name, size] of chunks) {
    bytes.write(name, offset, "latin1");
    bytes.writeUInt32LE(size, offset + 4);
    offset += 8 + size + (size % 2);
  }
  return bytes;
}

function chunkNames(bytes: Buffer) {
  const names: string[] = [];
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4);
    names.push(bytes.toString("latin1", offset, offset + 4));
    offset += 8 + size + (size % 2);
  }
  return names;
}

async function addTopic(page: Page, fileName: string, prompt: string) {
  await page.goto("/admin/topics/new");
  await page.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer: pngWithPrompt(prompt),
  });
  await page.getByRole("button", { name: "追加する" }).click();
  await expect(page.getByRole("row", { name: new RegExp(fileName) })).toContainText("完了");
  await page.getByRole("button", { name: `${fileName}を開く` }).click();
  await expect(page).toHaveURL(/\/admin\/topics\/[0-9a-f-]{36}$/);
  return page.url().split("/").at(-1) ?? "";
}

async function start(page: Page, code: string, settings: BattleSettings) {
  return page.evaluate(
    async (data) => {
      await window.animicTest.setRoomSettings({ data });
      return window.animicTest.startBattle({ data });
    },
    { code, settings, previousBattleId: null },
  );
}

test.afterAll(async () => {
  // ほかのファイルのテストが既定の候補を前提にするため、変えた内容を戻す。
  await executeLocalD1("DELETE FROM battle_option; DELETE FROM prompt_group");
});

test("画像からお題を非公開で追加し、メタデータを消した画像を配信して、公開すると出題する", async ({
  page,
  browser,
  request,
}) => {
  const secret = "e2e secret answer prompt";
  await loginAdmin(page);
  const topicId = await addTopic(page, "answer.png", secret);

  const image = page.getByRole("img", { name: "お題の画像" });
  const imageUrl = (await image.getAttribute("src")) ?? "";
  expect(parseTopicImageUrl(imageUrl, origin)?.topicId).toBe(topicId);
  const served = await request.get(imageUrl);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");
  expect(served.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  const bytes = await served.body();
  expect(inspectTopicWebp(new Uint8Array(bytes))).toBeNull();
  expect(bytes.toString("latin1")).not.toContain(secret);
  // 白で塗ってから描くため、透過のチャンクも残らない。
  expect(chunkNames(bytes)).not.toContain("ALPH");
  expect((await request.get(`/topic-images/${topicId}/${crypto.randomUUID()}`)).status()).toBe(404);

  await page.getByLabel("題名").fill("E2Eのお題");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("E2Eのお題");
  // 一覧のタイルは、画像の上を押しても詳細を開く。
  await page
    .getByRole("navigation", { name: "パンくず" })
    .getByRole("link", { name: "お題" })
    .click();
  await page.getByRole("link", { name: "E2Eのお題の詳細" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/topics/${topicId}$`));

  const guestContext = await browser.newContext({
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.29" },
  });
  try {
    const host = await browser.newPage({
      extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.30" },
    });
    const code = await create(host, "管理のホスト");
    await join(await guestContext.newPage(), code, "管理のゲスト");
    await expect
      .poll(async () => (await snapshot(host)).members.filter((member) => member.connected).length)
      .toBe(2);
    const settings: BattleSettings = {
      difficulty: "normal",
      durationSeconds: 120,
      selectionSeconds: 60,
    };
    // 非公開のお題は出題しない。
    expect((await start(host, code, settings)).error).toBe(
      "この難易度のお題がありません。別の難易度を選んでください。",
    );

    await page.getByRole("button", { name: "公開する" }).click();
    await expect(page.getByRole("button", { name: "非公開にする" })).toBeVisible();
    expect((await start(host, code, settings)).error).toBeNull();
    await expect.poll(async () => (await snapshot(host)).battle?.topic.imageUrl).toBe(imageUrl);
    await host.close();
  } finally {
    await guestContext.close();
  }

  await page.getByRole("button", { name: "非公開にする" }).click();
  await expect(page.getByRole("button", { name: "公開する" })).toBeVisible();
  await page.getByRole("button", { name: "お題を削除" }).click();
  const dialog = page.getByRole("alertdialog", { name: "お題を削除しますか？" });
  await dialog.getByRole("button", { name: "削除する" }).click();
  await expect(page).toHaveURL(/\/admin\/topics$/);
  await expect(page.getByRole("link", { name: "E2Eのお題の詳細" })).toHaveCount(0);
  // 削除しても、過去の対戦結果が参照する画像は配信を続ける。
  expect((await request.get(imageUrl)).status()).toBe(200);
});

test("メタデータの残った画像やWebP以外の画像を、Server Functionへ直接送っても保存しない", async ({
  page,
}) => {
  await loginAdmin(page);
  const files = [
    { bytes: [...riff(["VP8X", 10], ["VP8 ", 10], ["EXIF", 16])], type: "image/webp" },
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], type: "image/png" },
  ];
  const errors = await page.evaluate(async (inputs) => {
    const results: (string | null)[] = [];
    for (const { bytes, type } of inputs) {
      const form = new FormData();
      form.set("id", crypto.randomUUID());
      form.set("difficulty", "normal");
      form.set("file", new File([new Uint8Array(bytes)], "topic", { type }));
      results.push((await window.animicTest.createTopic({ data: form })).error);
    }
    return results;
  }, files);
  expect(errors).toEqual(["画像にメタデータが残っています。", "WebPの画像ではありません。"]);
});

test("対戦条件の候補と既定値を変えるとロビーに反映し、条件に合わない候補は保存しない", async ({
  page,
  browser,
}) => {
  await loginAdmin(page);
  await openAdminMenu(page, "対戦条件");
  await page.getByLabel("制限時間の候補1（秒）").fill("30");
  await page.getByLabel("制限時間の候補2（秒）").fill("30");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByRole("alert")).toHaveText("制限時間: 同じ秒数の候補が2つあります。");

  await page.getByLabel("制限時間の候補2（秒）").fill("45");
  await page.getByRole("button", { name: "制限時間の候補3を削除" }).click();
  await expect(page.getByLabel("制限時間の候補3（秒）")).toHaveCount(0);
  await page.getByRole("radiogroup", { name: "制限時間の既定値" }).getByText("45秒").click();
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("保存しました")).toBeVisible();

  const host = await browser.newPage({ extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.31" } });
  const code = await create(host, "条件のホスト");
  await host.goto(`/rooms/${code}`);
  const duration = host.getByRole("radiogroup", { name: "制限時間" });
  await expect(duration.getByRole("radio")).toHaveCount(2);
  await expect(duration.getByRole("radio", { name: "45秒" })).toBeChecked();
  await expect(duration.getByRole("radio", { name: "30秒" })).not.toBeChecked();
  await expect(
    host.getByRole("radiogroup", { name: "画像選択の猶予" }).getByRole("radio", { name: "15秒" }),
  ).toBeChecked();
  await host.close();
});

test("よく使う表現をグループに分けて追加・並べ替え・削除し、同じ語は同じグループに登録しない", async ({
  page,
}) => {
  await loginAdmin(page);
  await openAdminMenu(page, "よく使う表現");
  for (const label of ["髪の色", "目"]) {
    await page.getByRole("button", { name: "グループを追加" }).click();
    const dialog = page.getByRole("dialog", { name: "グループを追加" });
    await dialog.getByLabel("グループの名前").fill(label);
    await dialog.getByRole("button", { name: "保存する" }).click();
    await expect(dialog).toHaveCount(0);
  }
  const groups = page.getByRole("region", { name: "グループ" });
  await expect(groups.getByRole("row")).toHaveCount(3);
  await groups.getByRole("button", { name: "目を上へ" }).click();
  await expect(groups.getByRole("row").nth(1)).toContainText("目");

  await groups.getByRole("button", { name: "髪の色", exact: true }).click();
  for (const [label, tag] of [
    ["ピンクの髪", "pink hair"],
    ["桃色の髪", "pink hair"],
  ]) {
    await page.getByRole("button", { name: "表現を追加" }).click();
    const dialog = page.getByRole("dialog", { name: "表現を追加" });
    await dialog.getByLabel("表示名").fill(label);
    await dialog.getByLabel("NovelAIへ送る語").fill(tag);
    await dialog.getByRole("button", { name: "保存する" }).click();
    if (label === "桃色の髪") {
      await expect(dialog.getByRole("alert")).toHaveText(
        "このグループには同じ語の表現があります。",
      );
      await dialog.getByRole("button", { name: "やめる" }).click();
    } else await expect(dialog).toHaveCount(0);
  }
  const phrases = page.getByRole("region", { name: "髪の色の表現" });
  await expect(phrases.getByRole("row", { name: /ピンクの髪/ })).toContainText("pink hair");

  await groups.getByRole("button", { name: "目を削除" }).click();
  const confirm = page.getByRole("alertdialog", { name: "グループを削除しますか？" });
  await confirm.getByRole("button", { name: "削除する" }).click();
  await expect(groups.getByRole("row")).toHaveCount(2);
});

test("書き出したZIPを読み込むと、消したお題と画像・対戦条件・よく使う表現が元に戻る", async ({
  page,
}) => {
  await executeLocalD1("DELETE FROM prompt_group");
  await loginAdmin(page);
  const topicId = await addTopic(page, "backup.png", "backup prompt");
  const imageUrl = (await page.getByRole("img", { name: "お題の画像" }).getAttribute("src")) ?? "";
  await page.evaluate(async () => {
    await window.animicTest.saveBattleOptions({
      data: {
        duration: { choices: [40, 80], defaultSeconds: 80 },
        selection: { choices: [20], defaultSeconds: 20 },
      },
    });
    const groupId = crypto.randomUUID();
    await window.animicTest.savePromptGroup({ data: { id: groupId, label: "服" } });
    await window.animicTest.savePromptPhrase({
      data: { id: crypto.randomUUID(), groupId, label: "セーラー服", tag: "serafuku" },
    });
  });

  await openAdminMenu(page, "バックアップ");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "書き出す" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^animic-backup-\d{8}-\d{6}\.zip$/);
  const zip = await readFile((await download.path()) ?? "");

  const imageKey = `topics/${topicId}/${imageUrl.split("/").at(-1) ?? ""}`;
  await executeLocalD1(
    `DELETE FROM topic WHERE id = '${topicId}'; DELETE FROM battle_option; DELETE FROM prompt_group`,
  );
  await deleteLocalTopicImage(imageKey);
  expect((await page.request.get(imageUrl)).status()).toBe(404);

  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: "broken.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("x"),
  });
  await expect(page.getByRole("alert")).toHaveText("ZIPファイルを開けませんでした。");

  await file.setInputFiles({ name: "backup.zip", mimeType: "application/zip", buffer: zip });
  const summary = page.getByRole("region", { name: "読み込む内容" });
  await expect(summary.getByRole("row", { name: /^お題/ })).toContainText("1");
  await expect(summary.getByRole("row", { name: /^グループ/ })).toContainText("1");
  await expect(summary.getByRole("row", { name: /^表現/ })).toContainText("1");
  await page.getByRole("button", { name: "読み込む" }).click();
  await page
    .getByRole("alertdialog", { name: "読み込みますか？" })
    .getByRole("button", { name: "読み込む" })
    .click();
  await expect(page.getByText("読み込みました")).toBeVisible();

  expect((await page.request.get(imageUrl)).status()).toBe(200);
  const restored = await page.evaluate(async () => ({
    topics: (await window.animicTest.listAdminTopics()).topics,
    options: await window.animicTest.getBattleOptions(),
    groups: await window.animicTest.listPromptGroups(),
  }));
  expect(restored.topics.find((topic) => topic.id === topicId)).toMatchObject({
    imageKey,
    imageUrl,
    status: "unpublished",
  });
  expect(restored.options.duration).toEqual({ choices: [40, 80], defaultSeconds: 80 });
  expect(restored.groups.map((group) => group.label)).toEqual(["服"]);
  expect(restored.groups[0]?.phrases.map((phrase) => phrase.tag)).toEqual(["serafuku"]);
});
