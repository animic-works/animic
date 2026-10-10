import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectAccessible } from "./accessibility";

test("表の見出し・セル・行操作を読み取れ、狭い画面では表だけをキーボードで横へ送れる", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=data-table--records&viewMode=story&globals=a11y.manual:!true");
  const table = page.getByRole("table", { name: "登録一覧", exact: true });
  await expect(table.getByRole("columnheader")).toHaveCount(5);
  for (const cell of [
    table.getByRole("columnheader").first(),
    table.getByRole("rowheader").first(),
  ]) {
    await expect(cell).toHaveCSS("padding-block-start", "8px");
    await expect(cell).toHaveCSS("padding-inline-start", "12px");
  }
  await expect(table.getByRole("rowheader", { name: "東スタジオ" })).toBeVisible();
  await table
    .getByRole("row", { name: /東スタジオ/ })
    .getByRole("button")
    .click();
  await expect(page.getByText("東スタジオを選択しました。")).toBeVisible();
  await expectAccessible(
    new AxeBuilder({ page }).include("#storybook-root").withTags(["wcag2a", "wcag2aa", "wcag21aa"]),
  );
  await page.setViewportSize({ width: 320, height: 700 });
  const viewport = page.getByRole("region", { name: "登録一覧の表" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await viewport.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(table.getByRole("columnheader")).toHaveCount(5);
});

test("行がない場合も表の名前と列見出しを残し、空状態を一度表示する", async ({ page }) => {
  await page.goto("/iframe.html?id=data-table--empty&viewMode=story&globals=a11y.manual:!true");
  const table = page.getByRole("table", { name: "登録一覧", exact: true });
  await expect(table.getByRole("columnheader", { name: "ID" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "登録はありません。" })).toHaveCount(1);
});
