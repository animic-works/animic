import { expect, test } from "@playwright/test";

test("長い出力をキーボードで読み、文字拡大でも内容を横へ切らない", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=composition--data-outputs&viewMode=story&globals=a11y.manual:!true",
  );
  const output = page.getByRole("region", { name: "検出した特徴の出力" });
  await expect(output).toBeVisible();
  await output.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => output.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  for (const width of [1000, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const scale of [100, 200]) {
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}%`;
      }, scale);
      const widths = await page
        .locator(".animic-output-panel__body")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({ scroll: node.scrollWidth, visible: node.clientWidth })),
        );
      for (const box of widths) expect(box.scroll).toBeLessThanOrEqual(box.visible + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
});
