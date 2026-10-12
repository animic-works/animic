import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAccessible } from "./accessibility";

test("Progressの視覚的な残量と読み上げる割合が一致する", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=controls--progress-states&viewMode=story&globals=a11y.manual:!true",
  );
  for (const label of ["通常の進捗", "縞の進捗", "強調する進捗"]) {
    const track = page.getByRole("progressbar", { name: label });
    await expect(track).toHaveAttribute("aria-valuenow", "75");
    const geometry = await track.evaluate((node) => {
      const fill = node.querySelector<HTMLElement>('[data-part="range"]')!;
      return {
        widthRatio:
          fill.getBoundingClientRect().width /
          (node.clientWidth -
            parseFloat(getComputedStyle(node).paddingLeft) -
            parseFloat(getComputedStyle(node).paddingRight)),
        clip: getComputedStyle(fill).clipPath,
      };
    });
    expect(geometry.widthRatio).toBeCloseTo(1, 2);
    // 描画面を縮めず、読み上げる残量に合わせて末尾25%を切り取る。
    expect(geometry.clip).toBe("inset(0px 25% 0px 0px round 999px)");
  }
  const unknown = page.getByRole("progressbar", { name: "割合が未確定" });
  await expect(unknown).not.toHaveAttribute("aria-valuenow");
  await expect(unknown.locator('[data-part="range"]')).toHaveCSS("clip-path", "none");
  await expectAccessible(new AxeBuilder({ page }).include("main"));
});

test("時計は桁幅を保ち、動きを減らす設定では数字と進捗を点滅させない", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--progress-states&viewMode=story");
  const timer = page.getByRole("timer", { name: "残り時間" });
  await expect(timer).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(timer).toMatchAriaSnapshot('- timer "残り時間": 残り時間 1:09');
  const digits = await timer
    .locator(".animic-readout__digit")
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).width));
  expect(digits).toHaveLength(3);
  expect(new Set(digits).size).toBe(1);
  const value = timer.locator(".animic-readout__value");
  const fill = page
    .getByRole("progressbar", { name: "強調する進捗" })
    .locator('[data-part="range"]');
  await expect(value).not.toHaveCSS("animation-name", "none");
  await expect(fill).not.toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(value).toHaveCSS("animation-name", "none");
  await expect(fill).toHaveCSS("animation-name", "none");
  await expect(fill).toHaveCSS("transition-duration", "0s");
});
