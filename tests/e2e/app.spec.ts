import { expect, test } from "@playwright/test";

test.describe("SSR", () => {
  test.use({ javaScriptEnabled: false });

  test("JavaScriptなしでもトップの全セクションが縦に並んで表示される", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page).toHaveTitle("Animic");
    await expect(page.getByRole("heading", { name: "Animic", level: 1 })).toBeVisible();
    const logo = page.getByRole("img", { name: "Animic", exact: true }).first();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/animic-logo.svg");
    for (const name of ["遊び方", "採点方法", "ギャラリー"]) {
      await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "利用規約" })).toHaveAttribute("href", "/terms");
    // JavaScriptが動かない場合は、現在位置や「SCROLL」を出さない
    await expect(page.getByRole("button", { name: "SCROLL" })).toBeHidden();
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

test("トップはナビで画面を移動し、遊び方とギャラリーは左右キーで送れる", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-scroll", "");
  await expect(page.getByRole("link", { name: "ホーム" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "遊び方" }).click();
  await expect(page).toHaveURL(/#how$/);
  await expect(page.getByRole("link", { name: "遊び方" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "遊び方", level: 2 })).toBeInViewport();
  // 遊び方では左右キーでカードを送る
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "ステップ2: お題が公開される" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await page.getByRole("link", { name: "ギャラリー" }).click();
  await expect(page).toHaveURL(/#gallery$/);
  await expect(page.getByRole("heading", { name: "ギャラリー", level: 2 })).toBeInViewport();
  // ギャラリーでは左右キーで対戦を送る
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "2つ目の対戦" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("link", { name: "Animic ホームへ" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Animic ホームへ" }).first().click();
  await expect(page).toHaveURL(/#top$/);
});

test("ルームに参加のダイアログでコードを入れると参加画面へ進む", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ルームに参加する" }).click();
  const dialog = page.getByRole("dialog", { name: "ルームに参加" });
  await expect(dialog).toBeVisible();
  const join = dialog.getByRole("button", { name: "参加する" });
  await expect(join).toBeDisabled();
  await page.keyboard.type("abcdefgh");
  await expect(dialog.getByText("このコードで参加します")).toBeVisible();
  await expect(join).toBeEnabled();
  await join.click();
  await expect(page).toHaveURL("/rooms/ABCDEFGH", { timeout: 10_000 });
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

for (const [path, title] of [
  ["/terms", "利用規約"],
  ["/privacy", "プライバシーポリシー"],
] as const) {
  test(`${path}は${title}を表示する`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(page.locator("summary", { hasText: "目次" })).toBeVisible();
  });
}

test("仮の生成画像（挿絵）を配信する", async ({ request }) => {
  const response = await request.get("/art/blonde.bob.red.hoodie.wink.sky.svg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).toContain("<svg");
});

test("認証APIの正常応答も検索対象にしない", async ({ request }) => {
  const response = await request.get("/api/auth/get-session");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-robots-tag"]).toBe("noindex");
});

test("本番ホストのトップだけを検索対象にする", async ({ request }) => {
  for (const [host, path, indexable] of [
    ["animic.party", "/", true],
    ["animic.party", "/rooms/ABCDEFGH", false],
    ["animic.example.workers.dev", "/", false],
    ["dev.animic.party", "/", false],
  ] as const) {
    const response = await request.get(path, { headers: { Host: host } });
    expect(response.status()).toBe(path === "/" ? 200 : 404);
    expect(response.headers()["x-robots-tag"]).toBe(indexable ? undefined : "noindex");
  }
});
