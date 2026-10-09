import { expect, test } from "@playwright/test";

test("画像本来の比率を保ち、狭い領域では情報を縦に並べる", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=composition--intrinsic-media&viewMode=story&globals=a11y.manual:!true",
  );
  await expect(page.locator("figure")).toHaveCount(2);
  for (const width of [1440, 1024, 900, 744, 561, 560, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const figures = await page.locator("figure").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right };
      }),
    );
    expect(figures).toHaveLength(2);
    for (const figure of figures) {
      expect(figure.width / figure.height).toBeCloseTo(208 / 304, 2);
      expect(figure.width).toBeLessThanOrEqual(208);
      expect(figure.x).toBeGreaterThanOrEqual(0);
      expect(figure.right).toBeLessThanOrEqual(width);
    }
    expect(figures[0].y).toBeCloseTo(figures[1].y, 1);
    await expect(page.getByTestId("adaptive-surface")).toHaveCSS(
      "background-color",
      width <= 560 ? "rgb(255, 255, 255)" : "rgba(0, 0, 0, 0)",
    );
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const readingOrder = await page.locator("[data-animic-split-layout]").evaluate((node) => {
    const header = node.querySelector("[data-animic-split-header]")!.getBoundingClientRect();
    const content = node.querySelector("[data-animic-split-first]")!.getBoundingClientRect();
    const media = node.querySelector("[data-animic-split-second]")!.getBoundingClientRect();
    return header.bottom <= media.top && media.bottom <= content.top;
  });
  expect(readingOrder).toBe(true);
});
