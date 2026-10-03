import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// 画面の見た目の回帰テスト。意図しない見た目の変化を、基準のスクリーンショットとの差で見つける。
// 基準はOSやフォントで変わるため、プラットフォームごとに tests/visual/__screenshots__/ に保存する
// 送信元IPのヘッダーは自分のアプリへのリクエストにだけ付ける（すべてのリクエストに付けると、Google Fontsの読み込みがCORSで失敗する）
test.beforeEach(async ({ page, baseURL }) => {
  await page.route(
    (url) => url.origin === baseURL,
    (route) =>
      route.continue({
        headers: { ...route.request().headers(), "CF-Connecting-IP": "203.0.113.30" },
      }),
  );
});
test.use({ reducedMotion: "reduce" });

// Webフォントが当たってから撮る
async function fontsReady(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

async function createRoom(page: Page) {
  await page.goto("/rooms/new");
  await page.getByRole("button", { name: "ログインせずに進む" }).click();
  await page.getByLabel("表示名", { exact: true }).fill("ホスト");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page.getByRole("status").filter({ hasText: "接続済み" })).toHaveCount(1, {
    timeout: 15_000,
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    for (const screen of ["top", "how", "score", "gallery"]) {
      test(`home-${screen}`, async ({ page }) => {
        await page.goto(`/#${screen}`);
        await expect(page).toHaveURL(new RegExp(`#${screen}$`));
        await fontsReady(page);
        await expect(page).toHaveScreenshot(`home-${screen}-${viewport.name}.png`);
      });
    }

    test("room-new", async ({ page }) => {
      await page.goto("/rooms/new");
      await fontsReady(page);
      await expect(page).toHaveScreenshot(`room-new-${viewport.name}.png`);
      await page.getByRole("button", { name: "ログインせずに進む" }).click();
      await expect(page.getByRole("heading", { name: "表示名を決めよう" })).toBeVisible();
      await fontsReady(page);
      await expect(page).toHaveScreenshot(`room-name-${viewport.name}.png`);
    });

    test("room-waiting", async ({ page }) => {
      await createRoom(page);
      // ルームコードは毎回変わるため、比較から外す
      await fontsReady(page);
      await expect(page).toHaveScreenshot(`room-waiting-${viewport.name}.png`, {
        mask: [page.getByRole("group", { name: /^ルームコード / })],
      });
      await page.getByRole("button", { name: "招待する" }).first().click();
      await expect(page.getByRole("dialog", { name: "友だちを招待" })).toBeVisible();
      await fontsReady(page);
      await expect(page).toHaveScreenshot(`room-invite-${viewport.name}.png`, {
        mask: [
          page.getByLabel("ルームURL"),
          page.getByRole("img", { name: "ルームURLのQRコード" }),
          page.locator(".code-display__root"),
        ],
      });
    });

    test("terms", async ({ page }) => {
      await page.goto("/terms");
      await fontsReady(page);
      await expect(page).toHaveScreenshot(`terms-${viewport.name}.png`, { fullPage: true });
    });
  });
}
