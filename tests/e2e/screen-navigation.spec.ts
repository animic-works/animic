import { expect, test } from "@playwright/test";
import { openBattle } from "../fixtures/room-presentation";
import { executeLocalD1 } from "./d1";

test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg'); DELETE FROM rate_limit",
  );
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 800, height: 800 },
    { width: 1024, height: 768 },
  ]) {
    test(`再戦のロビーを先頭から表示する（${viewport.width}px・${reducedMotion}）`, async ({
      page,
      browser,
    }) => {
      test.setTimeout(60000);
      const context = await browser.newContext({ reducedMotion: "reduce" });
      try {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion });
        const guest = await context.newPage();
        await openBattle(page, guest, {
          difficulty: "easy",
          durationSeconds: 2,
          selectionSeconds: 1,
        });
        await expect(page.getByRole("heading", { name: "NO GAME", exact: true })).toBeVisible({
          timeout: 20000,
        });
        const rematch = page.getByRole("button", { name: "同じメンバーで再戦", exact: true });
        await rematch.scrollIntoViewIfNeeded();
        const url = page.url();
        await rematch.click();
        const lobby = page.getByRole("heading", { name: "ルームコード", exact: true });
        await expect(lobby).toBeVisible({ timeout: 10000 });
        expect(page.url()).toBe(url);
        await expect(page.locator("[inert]").filter({ has: lobby })).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      } finally {
        await context.close();
      }
    });
  }
}
