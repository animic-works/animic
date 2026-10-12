import * as v from "valibot";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { loginAdmin, openAdminMenu } from "./admin";
import { loadApi } from "./api";
import { executeLocalD1 } from "./d1";

// desktop-comfyui-serverの通信仕様で決まっているパスとキー名で、採点ワーカーとして振る舞う。
const workerApi = "/api/internal/hosts";
const linkedSchema = v.object({ hostId: v.string(), hostSecret: v.string() });

async function adminCalls(page: Page) {
  await loadApi(page);
  return page.evaluate(async () => {
    const calls = [
      () => window.animicTest.issueScoringLinkCode({ data: { name: "e2e" } }),
      () => window.animicTest.getScoringAdminData(),
      () => window.animicTest.revokeScoringWorker({ data: { id: crypto.randomUUID() } }),
      () => window.animicTest.listAdminTopics(),
      () =>
        window.animicTest.saveBattleOptions({
          data: {
            duration: { choices: [5], defaultSeconds: 5 },
            selection: { choices: [5], defaultSeconds: 5 },
          },
        }),
      () =>
        window.animicTest.savePromptGroup({
          data: { id: crypto.randomUUID(), label: "e2e", tone: "slate", target: "both" },
        }),
      () => {
        const form = new FormData();
        form.set("id", crypto.randomUUID());
        return window.animicTest.savePromptPhraseImage({ data: form });
      },
      () =>
        window.animicTest.updateScoringWeights({
          data: {
            weights: { ccip: 0, pixai: 25, siglip2: 25, dinov2: 25, depth: 25 },
            bonus: { speedPoints: 3, generationPoints: 3, minSimilarity: 0 },
          },
        }),
      () => window.animicTest.getImageModel(),
      () => window.animicTest.saveImageModel({ data: { model: "nai-diffusion-4-5-curated" } }),
      () => window.animicTest.getImageSteps(),
      () => window.animicTest.saveImageSteps({ data: { steps: 20 } }),
      () => window.animicTest.getBackup(),
      () => window.animicTest.applyBackupChunk({ data: {} }),
    ];
    const results: string[] = [];
    for (const call of calls) {
      try {
        await call();
        results.push("成功");
      } catch (error) {
        results.push(error instanceof Error ? error.message : "失敗");
      }
    }
    return results;
  });
}

test("パスワードでログインするまで、管理画面の内容と管理用の操作を使えない", async ({
  page,
  context,
}) => {
  const response = await page.goto("/admin");
  expect(response?.headers()["cache-control"]).toBe("private, no-store");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex");
  await expect(page.getByLabel("パスワード")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "管理メニュー" })).toHaveCount(0);
  // 管理画面の中の画面を直接開いても、パスワードの入力だけを表示する。
  const topics = await page.goto("/admin/topics");
  expect(topics?.headers()["cache-control"]).toBe("private, no-store");
  await expect(page.getByLabel("パスワード")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "管理メニュー" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "お題" })).toHaveCount(0);

  await page.getByLabel("パスワード").fill("wrong-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("alert")).toHaveText("パスワードが違います。");
  await expect(page.getByRole("navigation", { name: "管理メニュー" })).toHaveCount(0);

  // 署名の合わないセッションCookieも受け付けない。
  await context.addCookies([
    {
      name: "animic-admin",
      value: `${Date.now() + 60_000}.${"0".repeat(64)}`,
      url: "http://127.0.0.1:4173",
    },
  ]);
  for (const result of await adminCalls(page))
    expect(result).toContain("管理画面のパスワードでログインしてください。");
});

test("ログインしてリンクコードを発行し、リンクした採点ワーカーを一覧で確かめて失効できる", async ({
  page,
  request,
}) => {
  await loginAdmin(page);
  await openAdminMenu(page, "採点ワーカー");

  await page.getByRole("button", { name: "発行する" }).click();
  await expect(page.getByLabel("採点ワーカーの名前")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("名前を入力してください。", { exact: true })).toBeVisible();
  const name = `e2e-admin-${Date.now()}`;
  await page.getByLabel("採点ワーカーの名前").fill(name);
  await page.getByRole("button", { name: "発行する" }).click();
  const code = page.locator("output");
  await expect(code).toHaveText(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const linkedResponse = await request.post(`${workerApi}/link`, {
    data: { code: await code.textContent() },
  });
  expect(linkedResponse.status()).toBe(200);
  const worker = v.parse(linkedSchema, await linkedResponse.json());
  const heartbeat = () =>
    request.post(`${workerApi}/${worker.hostId}/heartbeat`, {
      headers: { Authorization: `Bearer ${worker.hostSecret}` },
      data: {
        comfyStatus: "available",
        gpu: { name: "E2E GPU", vramTotal: 8 * 1024 ** 3, vramFree: 4 * 1024 ** 3 },
      },
    });
  expect((await heartbeat()).status()).toBe(200);
  const jobId = crypto.randomUUID();
  await executeLocalD1(
    `INSERT INTO scoring_job (id, battle_id, room_code, workflow_version, inputs, state, created_at) VALUES ('${jobId}', 'battle-${jobId}', 'E2EROOM2', 'illust-similarity-v2', '[]', 'queued', ${Date.now()})`,
  );

  await page.getByRole("button", { name: "最新の状態にする" }).click();
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toContainText("available");
  await expect(row).toContainText("E2E GPU（空き4GB／8GB）");
  await expect(row).toContainText("有効");

  await row.getByRole("button", { name: "失効させる" }).click();
  const dialog = page.getByRole("dialog", { name: "採点ワーカーを失効させますか？" });
  await expect(dialog).toContainText(name);
  await dialog.getByRole("button", { name: "やめる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText("有効");
  await row.getByRole("button", { name: "失効させる" }).click();
  await dialog.getByRole("button", { name: "失効させる" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText("失効（");
  await expect(row.getByRole("button", { name: "失効させる" })).toHaveCount(0);
  expect((await heartbeat()).status()).toBe(401);
  const revoked = page.getByRole("status", { name: "失効させました", exact: true });
  await expect(revoked).toBeVisible();
  // 通知は時間で閉じる。
  await expect(revoked).toHaveCount(0);

  await openAdminMenu(page, "採点ジョブ");
  await expect(page.getByRole("row", { name: new RegExp(`battle-${jobId}`) })).toContainText(
    "待機中",
  );

  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page.getByLabel("パスワード")).toBeVisible();
  for (const result of await adminCalls(page))
    expect(result).toContain("管理画面のパスワードでログインしてください。");
});

test("画像生成のモデルを切り替えると表示と保存先が変わり、対応していないモデルは保存しない", async ({
  page,
}) => {
  await loginAdmin(page);
  await openAdminMenu(page, "画像生成");
  const current = page.getByRole("table", { name: "モデルの情報" });
  const models = page.getByRole("radiogroup", { name: "切り替えるモデル" });
  await expect(current).toContainText("V5 Curated");
  await expect(current).toContainText("nai-diffusion-5-curated");
  await expect(models.getByRole("radio", { name: "V5 Curated" })).toBeChecked();

  await models.getByText("V4.5 Curated").click();
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();
  await expect(current).toContainText("V4.5 Curated");
  // 生成キューのDOに保存したモデルを、開き直しても表示する。
  await page.reload();
  await expect(current).toContainText("nai-diffusion-4-5-curated");
  await expect(models.getByRole("radio", { name: "V4.5 Curated" })).toBeChecked();

  await loadApi(page);
  const result = await page.evaluate(async () => {
    try {
      // @ts-expect-error 選択肢にないモデルをServer Functionへ直接送る。
      await window.animicTest.saveImageModel({ data: { model: "nai-diffusion-5-full" } });
      return "成功";
    } catch (error) {
      return error instanceof Error ? error.message : "失敗";
    }
  });
  expect(result).toContain("対応していないモデルです。");
  expect(await page.evaluate(() => window.animicTest.getImageModel())).toBe(
    "nai-diffusion-4-5-curated",
  );

  await page.goto("/admin/image-generation");
  await models.getByText("V5 Curated").click();
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(current).toContainText("nai-diffusion-5-curated");
});

test("生成のステップ数を15〜28で保存し、範囲外や整数でない値は保存しない", async ({ page }) => {
  await loginAdmin(page);
  await openAdminMenu(page, "画像生成");
  const steps = page.getByRole("textbox", { name: "ステップ数" });
  const save = page.getByRole("button", { name: "保存する" });
  try {
    await expect(steps).toHaveValue("28");
    await steps.fill("18");
    await save.click();
    await expect(page.getByText("保存しました")).toBeVisible();
    // 生成キューのDOに保存したステップ数を、開き直しても表示する。
    await page.reload();
    await expect(steps).toHaveValue("18");

    for (const [value, message] of [
      ["14", "ステップ数は15以上にしてください。"],
      ["29", "ステップ数は28以下にしてください。"],
      ["2a", "ステップ数は数で指定してください。"],
    ] as const) {
      await steps.fill(value);
      await save.click();
      await expect(page.getByRole("alert")).toContainText(message);
    }
    // 画面からは入らない小数も、Server Functionで拒否する。
    await loadApi(page);
    const decimal = await page.evaluate(async () => {
      try {
        await window.animicTest.saveImageSteps({ data: { steps: 20.5 } });
        return "成功";
      } catch (error) {
        return error instanceof Error ? error.message : "失敗";
      }
    });
    expect(decimal).toContain("ステップ数は整数で指定してください。");
    expect(await page.evaluate(() => window.animicTest.getImageSteps())).toBe(18);
    await page.goto("/admin/image-generation");
    await expect(steps).toHaveValue("18");
  } finally {
    // 生成キューのDOはテストの間で共有するため、既定のステップ数に戻す。
    await loadApi(page);
    await page.evaluate(() => window.animicTest.saveImageSteps({ data: { steps: 28 } }));
  }
});

test("採点の重みとボーナスを保存し、合計が100でない重み・CCIPだけの重み・範囲外のボーナスは保存しない", async ({
  page,
}) => {
  await executeLocalD1("DELETE FROM scoring_weight");
  try {
    await loginAdmin(page);
    await openAdminMenu(page, "採点の重み");
    await expect(page.getByText("既定値を使っています。")).toBeVisible();
    const field = (name: string) => page.getByLabel(name, { exact: true });
    await expect(field("キャラ（CCIP）")).toHaveValue("35");
    const speed = field("最速提出ボーナス（点）");
    const generation = field("最少生成ボーナス（点）");
    const minimum = field("ボーナスの対象になる再現度の下限（点）");
    await expect(speed).toHaveValue("3");
    await expect(generation).toHaveValue("3");
    await expect(minimum).toHaveValue("0");
    await expect(field("構図（Depth Anything V2）")).toHaveValue("10");
    const sum = page.getByRole("status").filter({ hasText: "合計" });
    await expect(sum).toHaveText("合計 100");

    await field("構図（Depth Anything V2）").fill("20");
    await expect(sum).toHaveText("合計 110");
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page.getByRole("alert")).toHaveText("重みの合計を100にしてください。");

    for (const [name, value] of [
      ["キャラ（CCIP）", "100"],
      ["髪・服・小物（PixAI Tagger）", "0"],
      ["雰囲気（SigLIP 2）", "0"],
      ["絵の印象（DINOv2）", "0"],
      ["構図（Depth Anything V2）", "0"],
    ])
      await field(name).fill(value);
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "CCIP以外の指標にも重みを付けてください。人物のいない画像はCCIPを除いて採点します。",
    );

    await field("キャラ（CCIP）").fill("40");
    await field("構図（Depth Anything V2）").fill("60");
    for (const [input, value, message] of [
      [speed, "21", "最速提出ボーナスは0〜20点にしてください。"],
      [speed, "1.5", "最速提出ボーナスを数字で入力してください。"],
      [minimum, "101", "対象になる再現度の下限は0〜100点にしてください。"],
    ] as const) {
      await input.fill(value);
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page.getByRole("alert")).toHaveText(message);
      await input.fill(input === speed ? "3" : "0");
    }
    await speed.fill("0");
    await generation.fill("5");
    await minimum.fill("40");
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page.getByRole("status").filter({ hasText: "保存しました" })).toBeVisible();
    await page.reload();
    await expect(field("キャラ（CCIP）")).toHaveValue("40");
    await expect(field("構図（Depth Anything V2）")).toHaveValue("60");
    await expect(speed).toHaveValue("0");
    await expect(generation).toHaveValue("5");
    await expect(minimum).toHaveValue("40");
    await expect(page.getByText(/に保存した値を使っています。$/)).toBeVisible();

    // トップページの採点方法には今のボーナスを出し、0点の最速提出ボーナスのカードは出さない。
    await page.goto("/#score");
    const scoring = page.locator("#score");
    await expect(scoring.getByRole("listitem")).toHaveCount(2);
    await expect(scoring.getByRole("heading", { name: "提出速度" })).toHaveCount(0);
    await expect(
      scoring.getByText(
        "いちばん少ない回数で提出した人に5点（同点なら分け合います）。再現度40点以上の人が対象です。",
      ),
    ).toBeVisible();

    await page.goto("/admin/scoring/weights");
    await page.getByRole("button", { name: "既定値に戻す" }).click();
    await expect(field("キャラ（CCIP）")).toHaveValue("35");
    await expect(speed).toHaveValue("3");
    await expect(minimum).toHaveValue("0");
  } finally {
    await executeLocalD1("DELETE FROM scoring_weight");
  }
});
