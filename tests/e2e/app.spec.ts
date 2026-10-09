import { expect, test } from "@playwright/test";

test.describe("SSR", () => {
  test.use({ javaScriptEnabled: false });

  test("JavaScriptなしでもトップページの説明と操作が表示される", async ({ page }) => {
    const decorationRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/(?:animic-logo|home-(?:corner-)?decoration)\.svg$/.test(request.url()))
        decorationRequests.push(request.url());
    });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page).toHaveTitle("Animic");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const logo = page.locator("main").getByRole("img", { name: "Animic", exact: true }).first();
    await expect(logo).toBeVisible();
    await expect(logo.locator("image")).toHaveAttribute("href", /^data:image\/svg\+xml,/);
    await expect(page.getByRole("heading", { name: "遊び方" })).toBeVisible();
    await expect(page.getByRole("button", { name: "スタート", exact: true }).first()).toBeVisible();
    expect(decorationRequests).toEqual([]);
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
  await expect(
    page.locator("main").getByRole("img", { name: "Animic", exact: true }).first(),
  ).toBeVisible();
  const logoResponse = await page.request.get("/animic-logo.svg");
  expect(logoResponse.ok()).toBe(true);
  expect(logoResponse.headers()["content-type"]).toContain("image/svg+xml");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

for (const path of ["/not-a-route", "/rooms/INVALID"]) {
  test(`${path}は404画面を表示し、トップへ戻れる`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await page.getByRole("link", { name: "トップへ戻る" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.locator("main").getByRole("img", { name: "Animic", exact: true }).first(),
    ).toBeVisible();
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
    ["animic.party", "/rooms/ABCDEFGH", 404, false],
    ["animic.example.workers.dev", "/", 200, false],
    ["dev.animic.party", "/", 200, false],
  ] as const) {
    const response = await request.get(path, { headers: { Host: host } });
    expect(response.status()).toBe(status);
    expect(response.headers()["x-robots-tag"]).toBe(indexable ? undefined : "noindex");
  }
});
