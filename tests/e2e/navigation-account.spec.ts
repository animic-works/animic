import { expect, test } from "@playwright/test";
import { signIn } from "./api";

test.use({ reducedMotion: "reduce" });

for (const loggedIn of [true, false]) {
  for (const width of [1440, 950, 606, 390]) {
    test(`${loggedIn ? "ログイン済み" : "未ログイン"}のナビを最初のHTMLから表示し、起動後も領域を変えない（${width}px）`, async ({
      page,
    }) => {
      if (loggedIn) await signIn(page.context());
      const correct = loggedIn
        ? page.getByRole("button", { name: "アカウント（ホスト）", exact: true })
        : page.getByRole("link", { name: "マイページ", exact: true });
      const incorrect = loggedIn
        ? page.getByRole("link", { name: "マイページ", exact: true })
        : page.getByRole("button", { name: /^アカウント/ });
      await page.setViewportSize({ width, height: 900 });
      let release!: () => void;
      const scripts = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/*", async (route) => {
        if (route.request().resourceType() === "script") await scripts;
        await route.continue();
      });
      try {
        const response = await page.goto("/#how", { waitUntil: "commit" });
        expect(response?.headers()["cache-control"]).toBe("private, no-store");
        const header = page.locator("[data-animic-navigation]");
        await expect(header).toHaveAttribute("data-navigation-layout");
        // アプリのJavaScriptが動く前から、隠さず正しい操作を表示する。
        await expect(correct).toBeVisible();
        await expect(incorrect).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        const before = await header.boundingBox();
        release();
        await page.waitForFunction(() => Boolean(window.animicTest));
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await expect(correct).toBeVisible();
        await expect(incorrect).toHaveCount(0);
        expect(await header.boundingBox()).toEqual(before);
      } finally {
        release();
        await page.unrouteAll({ behavior: "wait" });
      }
    });
  }
}

test("古いブラウザーの記録を使わず、ログアウト後の再読み込みにもアカウントを残さない", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "animic-account",
      JSON.stringify({ name: "以前の人", provider: "discord", icon: null }),
    );
  });
  await signIn(page.context());
  await page.goto("/#how");
  const account = page.getByRole("button", { name: "アカウント（ホスト）", exact: true });
  await expect(account).toBeVisible();
  await account.click();
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(page.getByRole("link", { name: "マイページ", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "マイページ", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^アカウント/ })).toHaveCount(0);
});
