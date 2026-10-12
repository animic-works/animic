import { test, expect } from "@playwright/test";

test("初期表示のフォント定義をアプリ起動時に作り直さない", async ({ page }) => {
  let releaseScripts: (() => void) | undefined;
  const pendingScripts = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await pendingScripts;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("#top h1")).toBeVisible();
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("header")).not.toHaveAttribute("data-indicator-ready");
    const initialFonts = await page.evaluateHandle(() => [...document.fonts]);
    expect(
      await initialFonts.evaluate((faces) => faces.some((face) => face.status === "loaded")),
    ).toBe(true);
    releaseScripts?.();
    await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await initialFonts.evaluate((faces) => {
        const current = [...document.fonts];
        return current.length === faces.length && current.every((face) => faces.includes(face));
      }),
    ).toBe(true);
    await initialFonts.dispose();
  } finally {
    releaseScripts?.();
  }
});

for (const width of [1440, 900, 720, 600, 390]) {
  test(`フォントの取得前後でホームの内容とボタンがずれない（${width}px）`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    let releaseFonts: (() => void) | undefined;
    const pendingFonts = new Promise<void>((resolve) => {
      releaseFonts = resolve;
    });
    await page.route(/\.woff2?(\?|$)/, async (route) => {
      await pendingFonts;
      await route.continue();
    });
    const bounds = () =>
      page
        .locator("#top h1, #top h2, #top p, #top button")
        .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      // ホームの狭い幅ではナビを隠すため、線の計測完了を起動の目印にしない。
      await expect(page.locator("html")).toHaveAttribute("data-animic-scrollbars", "ready");
      await expect
        .poll(() =>
          page.evaluate(() => [...document.fonts].some((face) => face.status === "loading")),
        )
        .toBe(true);
      const displayPolicies = await page.evaluate(() =>
        [...document.fonts].filter((face) => face.status === "loading").map((face) => face.display),
      );
      expect(new Set(displayPolicies)).toEqual(new Set(["swap"]));
      const before = await bounds();
      expect(before.length).toBeGreaterThan(3);
      releaseFonts?.();
      await page.evaluate(() => document.fonts.ready);
      const after = await bounds();
      expect(after).toHaveLength(before.length);
      for (const [index, rect] of after.entries()) {
        for (const key of ["x", "y", "width", "height"]) {
          expect(Math.abs(rect[key] - before[index][key])).toBeLessThanOrEqual(0.5);
        }
      }
    } finally {
      releaseFonts?.();
    }
  });
}
