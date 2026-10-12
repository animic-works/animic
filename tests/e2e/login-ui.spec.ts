import { expect, test } from "@playwright/test";
import { create, signIn } from "./api";
import { executeLocalD1 } from "./d1";

const origin = "http://127.0.0.1:4173";
test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => {
  await executeLocalD1("DELETE FROM rate_limit");
});

test.describe("ログイン", () => {
  test("トップの「スタート」でログインのダイアログを開き、選ぶと接続中を表示して認証画面へ移動する", async ({
    page,
  }) => {
    // 実際のサービスへは通信せず、移動先のURLだけを確かめる。
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>Google</title>" }),
    );
    // 接続中の表示を確かめられるよう、ログインの開始の応答を遅らせる。
    await page.route("**/api/auth/sign-in/social", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });
    await page.goto("/");
    await page.getByRole("button", { name: "スタート", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "ログインしてはじめよう" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL("/");
    await expect(dialog.getByText("ルームを作るには、ログインが必要です。")).toBeVisible();
    await expect(dialog.getByRole("link", { name: "利用規約" })).toHaveAttribute("href", "/terms");
    await dialog.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: "スタート", exact: true }).first().click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Googleでログイン" }).click();
    await expect(dialog.getByRole("button", { name: "Googleに接続中…" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Discordでログイン" })).toBeDisabled();
    await page.waitForURL(/^https:\/\/accounts\.google\.com\//);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirect_uri")).toBe(`${origin}/api/auth/callback/google`);
  });

  test("ルームURLからはログインせずに進め、ログイン方法を選び直せる", async ({ page, browser }) => {
    const code = await create(page, "招待した人");
    const context = await browser.newContext({ reducedMotion: "reduce" });
    try {
      const guest = await context.newPage();
      await guest.goto(`/rooms/${code}`);
      await expect(guest.getByRole("heading", { name: "ログインしてはじめよう" })).toBeVisible();
      await expect(guest.getByText("に参加します", { exact: false })).toBeVisible();
      await expect(guest.getByText(code, { exact: true }).first()).toBeAttached();
      await expect(guest.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
      await expect(guest.getByRole("button", { name: "Discordでログイン" })).toBeVisible();
      await guest.getByRole("button", { name: "ログインせずに進む" }).click();
      await expect(guest.getByRole("heading", { name: "表示名を決めよう" })).toBeVisible();
      await guest.getByRole("button", { name: "ログイン方法を選び直す" }).click();
      await expect(guest.getByRole("heading", { name: "ログインしてはじめよう" })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("認証の失敗で戻ったら理由とログインの方法だけを出し、URLから理由を取り除く", async ({
    page,
  }) => {
    await page.goto("/start?error=access_denied");
    await expect(page.getByRole("alert")).toHaveText("ログインを取り消しました。");
    await expect(page).toHaveURL("/start");
    await expect(page.getByRole("heading", { name: "ログインしてはじめよう" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ログインせずに進む" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "表示名" })).toHaveCount(0);
  });

  test("ログイン中は方法の選択を省いてアカウントの名前を入れておき、ログアウトで選択へ戻る", async ({
    page,
  }) => {
    const userId = await signIn(page.context(), {
      provider: "discord",
      email: `${crypto.randomUUID()}@example.test`,
      name: "とても長いアカウントの名前で二十文字を超えています",
    });
    await page.goto("/start");
    await expect(page.getByRole("heading", { name: "表示名を決めよう" })).toBeVisible();
    await expect(page.getByText("Discordでログインしました")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "表示名" })).toHaveValue(
      "とても長いアカウントの名前で二十文字を超",
    );
    await expect(page.getByRole("button", { name: "ログイン方法を選び直す" })).toHaveCount(0);
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page.getByText("ログアウトしました")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ログインしてはじめよう" })).toBeVisible();
    expect(
      await executeLocalD1(`SELECT count(*) AS count FROM session WHERE user_id = '${userId}'`),
    ).toEqual([{ count: 0 }]);
  });
});
