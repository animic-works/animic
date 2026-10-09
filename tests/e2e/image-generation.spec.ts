import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

import type { BattleSnapshot } from "../../src/features/battle/battle-state";
import { create, join, snapshot } from "./api";
import { executeLocalD1 } from "./d1";
import { getNovelAiCalls, novelAiFailMarker, novelAiSlowMarker } from "./fake-novelai";

const origin = "http://127.0.0.1:4173";
type GenerationRequest = { code: string; battleId: string; generationId: string; prompt: string };

// 匿名参加の回数制限を、ほかのファイルのテストと分ける。
test.use({ extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.35" }, reducedMotion: "reduce" });

test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg')",
  );
});

async function battle(page: Page): Promise<BattleSnapshot> {
  const current = (await snapshot(page)).battle;
  if (!current) throw new Error("対戦が開始されていません。");
  return current;
}

/** ホストと参加者の2人で対戦を始める。 */
async function startBattle(page: Page, browser: Browser, durationSeconds: number) {
  const guestContext = await browser.newContext({
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.36" },
  });
  const code = await create(page, "生成ホスト");
  const guest = await guestContext.newPage();
  await join(guest, code, "生成ゲスト");
  await expect
    .poll(async () => (await snapshot(page)).members.filter((member) => member.connected).length)
    .toBe(2);
  const started = await page.evaluate(
    async (data) => {
      await window.animicTest.setRoomSettings({ data });
      return window.animicTest.startBattle({ data });
    },
    {
      code,
      settings: { difficulty: "easy" as const, durationSeconds, selectionSeconds: 10 },
      previousBattleId: null,
    },
  );
  expect(started.error).toBeNull();
  await expect.poll(async () => (await snapshot(guest)).battle?.id).toBeDefined();
  return { code, battleId: (await battle(page)).id, guest, guestContext };
}

/** 生成を要求し、拒否されたらエラーの文を返す。 */
function generate(page: Page, data: GenerationRequest) {
  return page.evaluate(async (input) => {
    try {
      await window.animicTest.generateImage({ data: input });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, data);
}

async function statuses(page: Page) {
  return (await battle(page)).myGenerations
    .toSorted((a, b) => a.acceptedAt - b.acceptedAt)
    .map((item) => item.status);
}

test("生成した画像をR2に保存して本人にだけ配信し、同じIDの再送ではNovelAIを呼ばない", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const { code, battleId, guest, guestContext } = await startBattle(page, browser, 600);
  try {
    const marker = `e2e-${crypto.randomUUID()}`;
    const request = {
      code,
      battleId,
      generationId: crypto.randomUUID(),
      prompt: `${marker}, 1girl, smile`,
    };
    expect(await generate(page, { ...request, prompt: " " })).not.toBeNull();
    expect(await generate(page, { ...request, prompt: "あ".repeat(1001) })).not.toBeNull();
    expect(await generate(page, request)).toBeNull();
    await expect.poll(() => statuses(page)).toEqual(["succeeded"]);
    const [generated] = (await battle(page)).myGenerations;
    if (generated?.status !== "succeeded") throw new Error("生成が成功していません。");
    expect(generated.id).toBe(request.generationId);
    expect(generated.imageUrl).toBe(
      `${origin}/generated-images/${battleId}/${request.generationId}`,
    );
    expect((await getNovelAiCalls(marker)).count).toBe(1);

    // 同じ処理IDの再送はNovelAIを呼ばず、同じIDで別の入力は拒否する。
    expect(await generate(page, request)).toBeNull();
    expect(await generate(page, { ...request, prompt: `${marker}, changed` })).toContain(
      "同じ処理ID",
    );
    expect((await getNovelAiCalls(marker)).count).toBe(1);
    expect((await battle(page)).myGenerations).toHaveLength(1);

    // メタデータと透過のないWebPを配信し、ない画像は404にする。
    const served = await page.request.get(generated.imageUrl);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toBe("image/webp");
    expect(served.headers()["cache-control"]).toBe("private, max-age=31536000, immutable");
    const bytes = await served.body();
    expect(bytes.toString("latin1", 0, 4)).toBe("RIFF");
    expect(bytes.toString("latin1", 8, 16)).toBe("WEBPVP8 ");
    expect(bytes.toString("latin1")).not.toContain(marker);
    for (const path of [
      `/generated-images/${battleId}/${crypto.randomUUID()}`,
      `/generated-images/${battleId}/not-a-uuid`,
    ]) {
      const missing = await page.request.get(path);
      expect(missing.status()).toBe(404);
      expect(missing.headers()["cache-control"]).toBe("no-store");
    }

    // 結果の確定前は相手へ配信しない。
    expect((await battle(guest)).myGenerations).toEqual([]);
    expect(JSON.stringify(await snapshot(guest))).not.toContain(request.generationId);
  } finally {
    await guestContext.close();
  }
});

test("生成中は次の生成を拒否し、全員の生成を1件ずつNovelAIへ送り、失敗も配信する", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const { code, battleId, guest, guestContext } = await startBattle(page, browser, 600);
  try {
    const marker = `e2e-${crypto.randomUUID()}`;
    const request = (prompt: string) => ({
      code,
      battleId,
      generationId: crypto.randomUUID(),
      prompt: `${marker} ${prompt}`,
    });
    const slow = generate(page, request(novelAiSlowMarker));
    await expect.poll(() => statuses(page)).toEqual(["pending"]);
    expect(await generate(page, request("second"))).toContain("生成が終わるまで");
    // 相手の生成は、ホストの生成が終わるまでNovelAIへ送らない。
    expect(await generate(guest, request("guest"))).toBeNull();
    expect(await slow).toBeNull();
    await expect.poll(() => statuses(page)).toEqual(["succeeded"]);
    await expect.poll(() => statuses(guest)).toEqual(["succeeded"]);
    expect(await getNovelAiCalls(marker)).toEqual({ count: 2, maxConcurrent: 1 });

    expect(await generate(page, request(novelAiFailMarker))).toBeNull();
    await expect.poll(() => statuses(page)).toEqual(["succeeded", "failed"]);
    const failed = (await battle(page)).myGenerations.find((item) => item.status === "failed");
    expect(failed).not.toHaveProperty("imageUrl");
  } finally {
    await guestContext.close();
  }
});

test("生成終了時刻を過ぎたら生成を受け付けない", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const { code, battleId, guestContext } = await startBattle(page, browser, 2);
  try {
    await expect
      .poll(async () => (await battle(page)).generationClosed, { timeout: 8000 })
      .toBe(true);
    const marker = `e2e-${crypto.randomUUID()}`;
    expect(
      await generate(page, { code, battleId, generationId: crypto.randomUUID(), prompt: marker }),
    ).toContain("受付は終了");
    expect((await getNovelAiCalls(marker)).count).toBe(0);
  } finally {
    await guestContext.close();
  }
});

test("対戦画面で「生成する」から生成して表示し、送れなかったら入力を残して同じIDで送り直す", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const { code, guestContext } = await startBattle(page, browser, 600);
  try {
    const marker = `e2e-${crypto.randomUUID()}`;
    const sent: string[] = [];
    page.on("request", (request) => {
      const body = request.postData() ?? "";
      if (request.url().includes("/_serverFn/") && body.includes(marker)) sent.push(body);
    });
    await page.goto(`/rooms/${code}`);
    await expect(page.getByRole("timer")).toBeVisible();
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    const generateButton = page.getByRole("button", { name: "生成する", exact: true });
    await expect(generateButton).toBeDisabled();
    await expect(page.getByText("プロンプトを入力してください")).toBeVisible();
    await input.fill(`${marker}、`);
    const token = page.getByRole("button", { name: `「${marker}」を書き直す` });
    await expect(token).toBeVisible();

    await page.route("**/_serverFn/**", (route) =>
      route.request().postData()?.includes(marker) ? route.abort() : route.fallback(),
    );
    await generateButton.click();
    await expect(
      page.getByRole("status").filter({ hasText: "画像を生成できませんでした" }),
    ).toBeVisible();
    await expect(token).toBeVisible();
    await page.unrouteAll();
    expect((await getNovelAiCalls(marker)).count).toBe(0);

    await input.press("ControlOrMeta+Enter");
    await expect(page.getByRole("img", { name: "1回目の画像" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1回目の画像", exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "プレイヤーの様子" })
        .getByRole("listitem", { name: "生成ホスト（あなた）: 考え中・生成 1回" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "この1枚で提出" })).toBeEnabled();
    expect((await getNovelAiCalls(marker)).count).toBe(1);
    // 送れなかった要求と同じ処理IDで送り直す。
    const ids = sent.map((body) => body.match(/[0-9a-f]{8}-[0-9a-f-]{27}/g)?.toSorted());
    expect(ids).toHaveLength(2);
    expect(ids[1]).toEqual(ids[0]);

    await input.fill(`${novelAiFailMarker}、`);
    await generateButton.click();
    await expect(page.getByRole("img", { name: "2回目は生成に失敗しました" })).toBeVisible();
    await expect(page.getByRole("img", { name: "1回目の画像" })).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
