import { readFile } from "node:fs/promises";
import { crc32, deflateSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { BattleSettings } from "../../src/features/battle/battle-state";
import { parseTopicImageUrl } from "../../src/features/battle/topic-images";
import { phraseImageKey, phraseImagePath } from "../../src/features/image-generation/phrase-images";
import { inspectWebp } from "../../src/lib/webp";
import { loginAdmin, openAdminMenu } from "./admin";
import { create, join, snapshot } from "./api";
import { executeLocalD1 } from "./d1";
import { deleteLocalPhraseImage, deleteLocalTopicImage } from "./r2";

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
function pngWithPrompt(prompt: string, width = 8, height = 8) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const row = Buffer.from([0, ...Array.from({ length: width }, () => [255, 64, 128, 96]).flat()]);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
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
  await page.goto("/admin/topics/new", { waitUntil: "networkidle" });
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

/** 表示名の表現の挿絵のURL（なければnull）。 */
async function phraseImageOf(page: Page, label: string) {
  const groups = await page.evaluate(() => window.animicTest.listPromptGroups());
  const phrase = groups.flatMap((group) => group.phrases).find((item) => item.label === label);
  return phrase?.imageId ? phraseImagePath({ phraseId: phrase.id, imageId: phrase.imageId }) : null;
}

/** 表現に、ブラウザーで作ったWebPを挿絵としてServer Functionから登録する。 */
async function setPhraseImage(page: Page, phraseId: string) {
  const error = await page.evaluate(async (id) => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp"));
    if (!blob) throw new Error("WebPを作れませんでした。");
    const form = new FormData();
    form.set("id", id);
    form.set("file", new File([blob], "phrase.webp", { type: "image/webp" }));
    return (await window.animicTest.savePromptPhraseImage({ data: form })).error;
  }, phraseId);
  expect(error).toBeNull();
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
  // 画面には、開いているページと同じオリジンのパスで渡す。
  expect(imageUrl).toMatch(/^\/topic-images\//);
  expect(parseTopicImageUrl(imageUrl)?.topicId).toBe(topicId);
  const served = await request.get(imageUrl);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");
  expect(served.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  const bytes = await served.body();
  expect(inspectWebp(new Uint8Array(bytes))).toBeNull();
  expect(bytes.toString("latin1")).not.toContain(secret);
  // 白で塗ってから描くため、透過のチャンクも残らない。
  expect(chunkNames(bytes)).not.toContain("ALPH");
  expect((await request.get(`/topic-images/${topicId}/${crypto.randomUUID()}`)).status()).toBe(404);

  await page.getByLabel("題名").fill("E2Eのお題");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("E2Eのお題");
  await expect(page.getByRole("status").filter({ hasText: "保存しました" })).toBeVisible();
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
    await expect(page.getByRole("status").filter({ hasText: "公開しました" })).toBeVisible();
    expect((await start(host, code, settings)).error).toBeNull();
    await expect.poll(async () => (await snapshot(host)).battle?.topic.imageUrl).toBe(imageUrl);
    await host.close();
  } finally {
    await guestContext.close();
  }

  await page.getByRole("button", { name: "非公開にする" }).click();
  await expect(page.getByRole("button", { name: "公開する" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "非公開にしました" })).toBeVisible();
  await page.getByRole("button", { name: "お題を削除" }).click();
  const dialog = page.getByRole("dialog", { name: "お題を削除しますか？" });
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

test("表現の辞書を初期データから始め、色・サフィックス・注釈・挿絵を付けて編集すると、対戦画面の検索と候補に出す", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await executeLocalD1("DELETE FROM prompt_group");
  await loginAdmin(page);
  await openAdminMenu(page, "表現の辞書");
  // D1が空なら、初期データ（23ジャンル）を登録してから表示する。
  const groups = page.getByRole("region", { name: "グループ" });
  await expect(groups.getByRole("radio")).toHaveCount(23);
  await groups.getByText("髪の色").click();
  await page.getByRole("button", { name: "グループの名前・色・入れる欄を変える" }).click();
  const editGroup = page.getByRole("dialog", { name: "グループを編集" });
  await expect(editGroup.getByRole("radio", { name: "ピンク", exact: true })).toBeChecked();
  await editGroup.getByRole("button", { name: "やめる" }).click();

  for (const [label, tone] of [
    ["E2Eの髪", "水色"],
    ["E2Eの目", "紫"],
  ] as const) {
    await page.getByRole("button", { name: "グループを追加" }).click();
    const dialog = page.getByRole("dialog", { name: "グループを追加" });
    await dialog.getByLabel("グループの名前").fill(label);
    await dialog.getByRole("radiogroup", { name: "目印の色" }).getByText(tone).click();
    await dialog.getByRole("button", { name: "保存する" }).click();
    await expect(dialog).toHaveCount(0);
  }
  // 追加したグループを選んだ状態になる。
  await expect(groups.getByRole("radio")).toHaveCount(25);
  await expect(page.getByRole("region", { name: "E2Eの目の表現" })).toContainText(
    "表現がまだありません",
  );
  await page.getByRole("button", { name: "E2Eの目を前へ" }).click();
  await expect(groups.getByRole("radio").nth(23)).toHaveAccessibleName(/^E2Eの目/);

  await groups.getByText("E2Eの髪").click();
  for (const [label, tag] of [
    ["おさげ", "e2e braids"],
    ["三つ編み", "e2e braids"],
  ]) {
    await page.getByRole("button", { name: "表現を追加" }).click();
    const dialog = page.getByRole("dialog", { name: "表現を追加" });
    await dialog.getByLabel("表示名").fill(label);
    await dialog.getByLabel("サフィックス").fill("（E2E）");
    await dialog.getByLabel("NovelAIへ送る語").fill(tag);
    await dialog.getByLabel("注釈").fill("E2Eの注釈");
    await dialog.getByRole("button", { name: "保存する" }).click();
    if (label === "三つ編み") {
      await expect(dialog.getByRole("alert")).toHaveText(
        "このグループには同じ語の表現があります。",
      );
      await dialog.getByRole("button", { name: "やめる" }).click();
    } else await expect(dialog).toHaveCount(0);
  }
  const phrases = page.getByRole("region", { name: "E2Eの髪の表現" });
  const braids = phrases.getByRole("article", { name: "おさげ（E2E）" });
  await expect(braids).toContainText("e2e braids");
  await expect(braids).toContainText("挿絵なし");

  // 挿絵は、メタデータを消して縮めたWebPで配信する。差し替えると前の画像は配信しない。
  const secret = "e2e illustration prompt";
  const illustration = (width: number, height: number) => ({
    name: "illustration.png",
    mimeType: "image/png",
    buffer: pngWithPrompt(secret, width, height),
  });
  const braidsImage = braids.getByRole("img", { name: "おさげの挿絵" });
  // カードで選ぶと、すぐに保存する。
  await braids.locator('input[type="file"]').setInputFiles(illustration(1280, 640));
  await expect(page.getByRole("status").filter({ hasText: "挿絵を保存しました" })).toBeVisible();
  const first = (await phraseImageOf(page, "おさげ")) ?? "";
  await expect(braidsImage).toHaveAttribute("src", first);
  await expect(braids.getByRole("button", { name: "挿絵を変える" })).toBeVisible();
  const served = await page.request.get(first);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");
  expect(served.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  const bytes = await served.body();
  expect(inspectWebp(new Uint8Array(bytes))).toBeNull();
  expect(bytes.toString("latin1")).not.toContain(secret);
  expect(
    await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, first),
  ).toEqual([640, 320]);
  // 編集のダイアログでは、保存済みの挿絵を出し、選び直して保存できる。
  await braids.getByRole("button", { name: "おさげを編集" }).click();
  const editBraids = page.getByRole("dialog", { name: "表現を編集" });
  const preview = editBraids.getByRole("img", { name: "挿絵のプレビュー" });
  await expect(preview).toHaveAttribute("src", first);
  await editBraids.locator('input[type="file"]').setInputFiles(illustration(8, 8));
  await expect(preview).toHaveAttribute("src", /^blob:/);
  await editBraids.getByRole("button", { name: "保存する" }).click();
  await expect(editBraids).toHaveCount(0);
  const replaced = (await phraseImageOf(page, "おさげ")) ?? "";
  expect(replaced).not.toBe(first);
  await expect(braidsImage).toHaveAttribute("src", replaced);
  expect((await page.request.get(first)).status()).toBe(404);

  // 挿絵のある表現を入れたグループを消すと、挿絵も配信しない。
  const eyeId = await page.evaluate(async () => {
    const group = (await window.animicTest.listPromptGroups()).find(
      (item) => item.label === "E2Eの目",
    );
    if (!group) throw new Error("E2Eの目がありません。");
    const id = crypto.randomUUID();
    await window.animicTest.savePromptPhrase({
      data: {
        id,
        groupId: group.id,
        label: "E2Eの赤い目",
        suffix: "",
        tag: "e2e red eyes",
        note: "",
      },
    });
    return id;
  });
  await setPhraseImage(page, eyeId);
  const eyeImage = (await phraseImageOf(page, "E2Eの赤い目")) ?? "";
  expect((await page.request.get(eyeImage)).status()).toBe(200);
  await groups.getByText("E2Eの目").click();
  await page.getByRole("button", { name: "グループを削除" }).click();
  const confirm = page.getByRole("dialog", { name: "グループを削除しますか？" });
  await confirm.getByRole("button", { name: "削除する" }).click();
  await expect(groups.getByRole("radio")).toHaveCount(24);
  expect((await page.request.get(eyeImage)).status()).toBe(404);

  // 次に開いた対戦画面の検索と入力候補に、編集した内容が出る。
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg')",
  );
  const guestContext = await browser.newContext({
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.32" },
  });
  const host = await browser.newPage({
    reducedMotion: "reduce",
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.33" },
  });
  try {
    const code = await create(host, "辞書のホスト");
    await join(await guestContext.newPage(), code, "辞書のゲスト");
    await expect
      .poll(async () => (await snapshot(host)).members.filter((member) => member.connected).length)
      .toBe(2);
    const started = await start(host, code, {
      difficulty: "easy",
      durationSeconds: 600,
      selectionSeconds: 10,
    });
    expect(started.error).toBeNull();
    await host.goto(`/rooms/${code}`);
    await expect(host.getByRole("timer")).toBeVisible();

    await host.getByRole("button", { name: "キャラを検索" }).click();
    const search = host.getByRole("dialog", { name: "キャラプロンプトを検索" });
    await search.getByRole("radiogroup", { name: "ジャンル" }).getByText("E2Eの髪").click();
    const card = search.getByRole("button", { name: "おさげ（E2E）をキャラに入れる" });
    await expect(card).toContainText("e2e braids");
    await expect(card).toContainText("E2Eの注釈");
    await expect(card.locator("img")).toHaveAttribute("src", replaced);
    await expect(card).not.toContainText("No Image");
    await expect(search.getByRole("radiogroup", { name: "ジャンル" })).not.toContainText("E2Eの目");
    // カードの角のボタンで挿絵の全体を重ねて出し、そのまま欄へ出し入れできる。
    const view = search.getByRole("button", { name: "おさげ（E2E）の挿絵を見る" });
    await view.click();
    const viewer = host.getByRole("dialog", { name: "おさげ（E2E）" });
    await expect(viewer.getByRole("img", { name: "おさげ（E2E）の挿絵" })).toHaveAttribute(
      "src",
      replaced,
    );
    await expect(viewer).toContainText("e2e braids");
    await expect(viewer.getByRole("heading", { name: "E2Eの髪のほかの表現" })).toBeVisible();
    await expect(
      viewer
        .getByRole("list", { name: "E2Eの髪のほかの表現" })
        .getByRole("button", { name: "おさげ（E2E）" }),
    ).toHaveAttribute("aria-current", "true");
    await viewer.getByRole("button", { name: "キャラに入れる" }).click();
    await expect(viewer.getByText("キャラに入っています")).toBeVisible();
    await viewer.getByRole("button", { name: "キャラから外す" }).click();
    await expect(viewer.getByRole("button", { name: "キャラに入れる" })).toBeVisible();
    await host.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(search).toBeVisible();
    await expect(view).toBeFocused();
    await expect(card).toHaveAttribute("aria-pressed", "false");
    await search.getByRole("button", { name: "決定" }).click();

    // 候補にもサフィックスを出すが、欄に入るのは表示名だけ。
    const input = host.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await input.fill("おさげ");
    await host
      .getByRole("listbox", { name: "入力候補" })
      .getByRole("option", { name: /おさげ（E2E）/ })
      .click();
    await expect(host.getByRole("button", { name: "「おさげ」を書き直す" })).toBeVisible();
  } finally {
    await host.close();
    await guestContext.close();
  }

  // 挿絵を外すと、前の画像は配信しない。
  await groups.getByText("E2Eの髪").click();
  await braids.getByRole("button", { name: "おさげを編集" }).click();
  await editBraids.getByRole("button", { name: "挿絵を外す" }).click();
  await expect(editBraids.getByText("挿絵はありません")).toBeVisible();
  await editBraids.getByRole("button", { name: "保存する" }).click();
  await expect(editBraids).toHaveCount(0);
  expect(await phraseImageOf(page, "おさげ")).toBeNull();
  await expect(braids).toContainText("挿絵なし");
  expect((await page.request.get(replaced)).status()).toBe(404);
});

test("書き出したZIPを読み込むと、選んだ項目（お題と画像・対戦条件・表現の辞書と挿絵）が元に戻る", async ({
  page,
}) => {
  await executeLocalD1("DELETE FROM prompt_group");
  await loginAdmin(page);
  const topicId = await addTopic(page, "backup.png", "backup prompt");
  const imageUrl = (await page.getByRole("img", { name: "お題の画像" }).getAttribute("src")) ?? "";
  const phraseId = await page.evaluate(async () => {
    await window.animicTest.saveBattleOptions({
      data: {
        duration: { choices: [40, 80], defaultSeconds: 80 },
        selection: { choices: [20], defaultSeconds: 20 },
      },
    });
    const groupId = crypto.randomUUID();
    await window.animicTest.savePromptGroup({
      data: { id: groupId, label: "服", tone: "cyan", target: "character" },
    });
    const id = crypto.randomUUID();
    await window.animicTest.savePromptPhrase({
      data: {
        id,
        groupId,
        label: "セーラー服",
        suffix: "（夏）",
        tag: "serafuku",
        note: "E2Eの注釈",
      },
    });
    return id;
  });
  await setPhraseImage(page, phraseId);
  const phraseImage = (await phraseImageOf(page, "セーラー服")) ?? "";

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
  const phraseImageId = phraseImage.split("/").at(-1) ?? "";
  await deleteLocalPhraseImage(phraseImageKey({ phraseId, imageId: phraseImageId }));
  expect((await page.request.get(imageUrl)).status()).toBe(404);
  expect((await page.request.get(phraseImage)).status()).toBe(404);

  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: "broken.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("x"),
  });
  await expect(page.getByRole("alert")).toHaveText("ZIPファイルを開けませんでした。");

  const summary = page.getByRole("region", { name: "読み込む内容" });
  const items = page.getByRole("group", { name: "読み込む項目" });
  const confirmImport = page.getByRole("dialog", { name: "読み込みますか？" });
  await file.setInputFiles({ name: "backup.zip", mimeType: "application/zip", buffer: zip });
  await expect(summary.getByRole("row", { name: /^お題/ })).toContainText("1");
  await expect(summary.getByRole("row", { name: /^グループ/ })).toContainText("1");
  await expect(summary.getByRole("row", { name: /^表現/ })).toContainText("1");

  // 表現の辞書だけを選んで読み込むと、お題と対戦条件の候補は変えない。
  await items.getByText("お題（画像を含む）", { exact: true }).click();
  await items.getByText("対戦条件の候補", { exact: true }).click();
  await expect(items.getByRole("checkbox", { name: "お題（画像を含む）" })).not.toBeChecked();
  await expect(summary.getByRole("row", { name: /^お題/ })).toHaveCount(0);
  await page.getByRole("button", { name: "読み込む" }).click();
  await expect(confirmImport).toContainText("表現の辞書（挿絵を含む）を読み込みます。");
  await confirmImport.getByRole("button", { name: "読み込む" }).click();
  // 確認のダイアログは、書き込みが終わってから閉じる。
  await expect(confirmImport).toHaveCount(0);
  await expect(summary).toHaveCount(0);
  expect((await page.request.get(phraseImage)).status()).toBe(200);
  expect((await page.request.get(imageUrl)).status()).toBe(404);
  const partial = await page.evaluate(async () => ({
    topics: (await window.animicTest.listAdminTopics()).topics,
    options: await window.animicTest.getBattleOptions(),
  }));
  expect(partial.topics.some((topic) => topic.id === topicId)).toBe(false);
  expect(partial.options.duration).not.toEqual({ choices: [40, 80], defaultSeconds: 80 });

  // 開き直すと、すべての項目を選んだ状態に戻る。残りも読み込むと元に戻る。
  await file.setInputFiles({ name: "backup.zip", mimeType: "application/zip", buffer: zip });
  await expect(items.getByRole("checkbox", { name: "お題（画像を含む）" })).toBeChecked();
  await page.getByRole("button", { name: "読み込む" }).click();
  await expect(confirmImport).toContainText(
    "お題（画像を含む）・対戦条件の候補・表現の辞書（挿絵を含む）を読み込みます。",
  );
  await confirmImport.getByRole("button", { name: "読み込む" }).click();
  await expect(confirmImport).toHaveCount(0);
  await expect(summary).toHaveCount(0);

  expect((await page.request.get(imageUrl)).status()).toBe(200);
  expect((await page.request.get(phraseImage)).status()).toBe(200);
  const restored = await page.evaluate(async () => ({
    topics: (await window.animicTest.listAdminTopics()).topics,
    options: await window.animicTest.getBattleOptions(),
    groups: await window.animicTest.listPromptGroups(),
  }));
  expect(restored.topics.find((topic) => topic.id === topicId)).toMatchObject({
    imageKey,
    // 記録するURLは、読み込んだ環境の`BETTER_AUTH_URL`を基にした絶対URL。
    imageUrl: `${origin}${imageUrl}`,
    status: "unpublished",
  });
  expect(restored.options.duration).toEqual({ choices: [40, 80], defaultSeconds: 80 });
  expect(restored.groups.find((group) => group.label === "服")).toMatchObject({
    tone: "cyan",
    phrases: [
      {
        id: phraseId,
        label: "セーラー服",
        suffix: "（夏）",
        tag: "serafuku",
        note: "E2Eの注釈",
        imageId: phraseImageId,
      },
    ],
  });
});

test("トップページの遊び方・ギャラリー・OGP画像を管理画面で編集すると、トップページに出す", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await executeLocalD1(
    "DELETE FROM home_item; DELETE FROM site_setting; DELETE FROM gallery_item WHERE id NOT LIKE 'initial-%'",
  );
  const secret = "e2e home prompt";
  const image = (name: string, width: number, height: number) => ({
    name,
    mimeType: "image/png",
    buffer: pngWithPrompt(secret, width, height),
  });
  try {
    await loginAdmin(page);
    await openAdminMenu(page, "トップページ");

    // 遊び方の手順2の題名・本文・画像を変える。
    await page.getByRole("button", { name: "手順2を編集" }).click();
    const item = page.getByRole("dialog", { name: "項目を編集" });
    await item.getByLabel("題名").fill("E2Eの手順");
    await item.getByLabel("本文").fill("E2Eの本文");
    await item.locator('input[type="file"]').setInputFiles(image("step.png", 160, 110));
    await expect(item.getByRole("img", { name: "画像のプレビュー" })).toHaveAttribute(
      "src",
      /^blob:/,
    );
    await item.getByRole("button", { name: "保存する" }).click();
    await expect(item).toHaveCount(0);

    // ギャラリーに例を足す。点数が範囲外なら保存しない。
    await page.getByRole("button", { name: "例を追加" }).click();
    const gallery = page.getByRole("dialog", { name: "ギャラリーの例を追加" });
    await gallery.getByRole("radiogroup", { name: "難易度" }).getByText("むずかしい").click();
    await gallery.getByLabel("再現度").fill("101");
    for (const label of ["キャラクター", "タグ", "内容", "画像の特徴", "構図"])
      await gallery.getByLabel(label, { exact: true }).fill("50");
    await gallery
      .locator('input[type="file"]')
      .nth(0)
      .setInputFiles(image("topic.png", 83, 121));
    await gallery.getByLabel("お題の画像の説明").fill("E2Eのお題");
    await gallery
      .locator('input[type="file"]')
      .nth(1)
      .setInputFiles(image("shot.png", 83, 121));
    await gallery.getByLabel("提出の画像の説明").fill("E2Eの提出");
    await gallery.getByRole("button", { name: "保存する" }).click();
    await expect(gallery.getByText("再現度は0〜100で入力してください。")).toBeVisible();
    await gallery.getByLabel("再現度").fill("88.8");
    await gallery.getByRole("button", { name: "保存する" }).click();
    await expect(gallery).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "ギャラリー（7件）" })).toBeVisible();

    // OGP画像は1200×630だけを受け付け、メタデータを消したPNGで配信する。
    const og = page.getByRole("region", { name: "OGP画像" });
    await og.locator('input[type="file"]').setInputFiles(image("og.png", 1200, 600));
    await expect(
      page.getByRole("status").filter({ hasText: "1200×630の画像を選んでください（1200×600）。" }),
    ).toBeVisible();
    await og.locator('input[type="file"]').setInputFiles(image("og.png", 1200, 630));
    await expect(
      page.getByRole("status").filter({ hasText: "OGP画像を保存しました" }),
    ).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "E2Eの手順", includeHidden: true })).toHaveCount(
      1,
    );
    await expect(page.getByText("1 / 7")).toBeVisible();
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toMatch(/^https:\/\/animic\.party\/site-images\/[0-9a-f-]{36}$/);
    const served = await page.request.get(new URL(ogImage ?? "").pathname);
    expect(served.headers()["content-type"]).toBe("image/png");
    const bytes = await served.body();
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.includes(secret)).toBe(false);
  } finally {
    await executeLocalD1(
      "DELETE FROM home_item; DELETE FROM site_setting; DELETE FROM gallery_item WHERE id NOT LIKE 'initial-%'",
    );
  }
});
