import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAccessible } from "./accessibility";

for (const story of [
  "screen-layouts--focus",
  "screen-layouts--document",
  "screen-layouts--frame",
  "screen-layouts--editing",
  "screen-layouts--comparing",
  "collections--tiles",
  "collections--images",
  "collections--records",
  "display-details--codes",
  "display-details--decoration",
]) {
  test(`${story}: 幅が変わっても内容と操作を保つ`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story}&viewMode=story&globals=a11y.manual:!true`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    for (const width of [390, 800, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await expectAccessible(new AxeBuilder({ page }).include("#storybook-root"));
    }
  });
}

test("画像履歴の選択・空状態・拡大通知を扱う", async ({ page }) => {
  await page.goto("/iframe.html?id=collections--images&viewMode=story");
  const history = page.getByRole("list", { name: "画像の履歴" });
  await history.getByRole("button", { name: "画像 3", exact: true }).click();
  await expect(history.getByRole("button", { name: "画像 3", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(history.getByRole("button", { name: "画像 6", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "選んだ画像を拡大" }).click();
  await expect(page.getByText("拡大操作を受け取りました。")).toBeVisible();
  await page.getByRole("button", { name: "空にする" }).click();
  await expect(page.getByText("画像がありません", { exact: true })).toBeVisible();
});

test("横に続く参加者一覧をキーボードで読める", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/iframe.html?id=screen-layouts--comparing&viewMode=story");
  const members = page.getByRole("list", { name: "進行状況" });
  await members.focus();
  await expect(members).toBeFocused();
  await members.press("ArrowRight");
  await expect.poll(() => members.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("編集領域は利用可能な幅で縦に並び、開閉と文字拡大でも操作できる", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await page.goto("/iframe.html?id=screen-layouts--editing&viewMode=story");
  const editor = page.getByRole("region", { name: "編集", exact: true });
  const media = page.getByRole("img", { name: "比較元", exact: true });
  expect((await media.boundingBox())!.y).toBeLessThan((await editor.boundingBox())!.y);
  await expect(page.getByText("さくら", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  const editorBox = (await editor.boundingBox())!;
  const mediaBox = (await media.boundingBox())!;
  expect(editorBox.x + editorBox.width).toBeLessThan(mediaBox.x);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "編集を畳む" }).click();
  await expect(editor.getByRole("textbox", { name: "説明" })).toBeHidden();
  await page.getByRole("button", { name: "編集を開く" }).click();
  await expect(editor.getByRole("textbox", { name: "説明" })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await editor.getByRole("textbox", { name: "説明" }).fill("文字を拡大して入力");
  await expect(editor.getByRole("button", { name: "反映する" })).toBeEnabled();
});
