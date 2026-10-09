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
      () => window.animicTest.listPromptGroups(),
      () => window.animicTest.savePromptGroup({ data: { id: crypto.randomUUID(), label: "e2e" } }),
      () => window.animicTest.getImageModel(),
      () => window.animicTest.saveImageModel({ data: { model: "nai-diffusion-4-5-curated" } }),
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
