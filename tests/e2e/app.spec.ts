import { expect, test } from "@playwright/test";

test.describe("SSR", () => {
  test.use({ javaScriptEnabled: false });

  test("JavaScriptなしでロゴだけのトップページが表示される", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Animic");
    await expect(page.getByRole("heading", { name: "Animic", level: 1 })).toBeVisible();
    const logo = page.getByRole("img", { name: "Animic", exact: true });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/animic-logo.svg");
    await expect(page.locator("main button, main input, main a")).toHaveCount(0);
  });
});

test("ロゴが読み込まれ、狭い画面でも横にはみ出さない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page.getByRole("img", { name: "Animic", exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("main img")
        .evaluate(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

for (const path of ["/not-a-route", "/rooms/ABCDEFGH"]) {
  test(`${path}は404画面を表示し、トップへ戻れる`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await page.getByRole("link", { name: "トップへ戻る" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("img", { name: "Animic", exact: true })).toBeVisible();
  });
}
