import { expect, test } from "@playwright/test";

test.describe("SSR", () => {
  test.use({ javaScriptEnabled: false });

  test("JavaScriptなしでトップページが表示される", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Animic", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "遊び方" })).toBeVisible();
  });
});

test("遊び方をマウスで開き、キーボードで閉じられる", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Animic");
  const trigger = page.getByRole("button", { name: "遊び方" });
  const instructions = page.getByText("生成履歴から好きな1枚を選んで提出。");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(instructions).toBeHidden();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(instructions).toBeVisible();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(instructions).toBeHidden();
  expect(errors).toEqual([]);
});

test("存在しないURLは404画面を表示し、トップへ戻れる", async ({ page }) => {
  const response = await page.goto("/not-a-route");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  await page.getByRole("link", { name: "トップへ戻る" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Animic", level: 1 })).toBeVisible();
});
