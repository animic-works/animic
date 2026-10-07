import { expect, test } from "@playwright/test";

test.describe("SSR", () => {
  test.use({ javaScriptEnabled: false });

  test("JavaScriptなしでもトップページの内容が表示される", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page).toHaveTitle("Animic");
    await expect(page.getByRole("heading", { name: "Animic", level: 1 })).toBeVisible();
    const logo = page.getByRole("img", { name: "Animic", exact: true }).first();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/animic-logo.svg");
    await expect(page.getByRole("link", { name: "スタート" }).first()).toHaveAttribute(
      "href",
      "/start",
    );
    for (const name of ["遊び方", "スコアの決まり方", "ギャラリー"]) {
      await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
    }
    await expect(page.getByText("※ 画像と対戦結果はサンプルです")).toBeVisible();
    const description = /お題のイラストを、プロンプトだけでAIに再現させよう/;
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      description,
    );
  });
});

test("トップのロゴが読み込まれ、狭い画面でも横にはみ出さない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const logo = page.getByRole("img", { name: "Animic", exact: true }).first();
  await expect(logo).toBeVisible();
  await expect
    .poll(() =>
      logo.evaluate(
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
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await page.getByRole("link", { name: "トップへ戻る" }).click();
    await expect(page).toHaveURL(/\/(#top)?$/);
    await expect(page.getByRole("img", { name: "Animic", exact: true }).first()).toBeVisible();
  });
}

test("認証APIの正常応答も検索対象にしない", async ({ request }) => {
  const response = await request.get("/api/auth/get-session");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-robots-tag"]).toBe("noindex");
});

test("本番ホストのトップだけを検索対象にする", async ({ request }) => {
  for (const [host, path, status, indexable] of [
    ["animic.party", "/", 200, true],
    ["animic.party", "/start", 200, false],
    ["animic.party", "/terms", 200, false],
    ["animic.party", "/privacy", 200, false],
    ["animic.party", "/rooms/ABCDEFGH", 404, false],
    ["animic.example.workers.dev", "/", 200, false],
    ["dev.animic.party", "/", 200, false],
  ] as const) {
    const response = await request.get(path, { headers: { Host: host } });
    expect(response.status()).toBe(status);
    expect(response.headers()["x-robots-tag"]).toBe(indexable ? undefined : "noindex");
  }
});
