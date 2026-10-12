import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { reviewViolations } from "./accessibility";

test("許容した色ペアだけを区別し、別の色や操作名の欠落を見逃さない", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--buttons&viewMode=story&globals=a11y.manual:!true");
  const primary = page.getByRole("button", { name: "Primary", exact: true });
  await expect(primary).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const audit = () =>
    new AxeBuilder({ page }).include("main").withRules(["color-contrast", "button-name"]).analyze();
  const original = reviewViolations((await audit()).violations);
  expect(original.accepted.length).toBeGreaterThan(0);
  expect(original.unexpected).toEqual([]);

  await primary.evaluate((node) => {
    node.style.backgroundColor = "#ff2d88";
  });
  await page.getByRole("button", { name: "Secondary", exact: true }).evaluate((node) => {
    node.textContent = "";
  });
  const changed = reviewViolations((await audit()).violations);
  expect(changed.accepted.length).toBeGreaterThan(0);
  expect(changed.unexpected.map(({ id }) => id).toSorted()).toEqual([
    "button-name",
    "color-contrast",
  ]);
});
