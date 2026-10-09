import { test, expect } from "@playwright/test";
import { openBattle, openLobby } from "../fixtures/room-presentation";
import { executeLocalD1 } from "./d1";
import { signIn } from "./api";

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg'); DELETE FROM rate_limit",
  );
});

test("ログインして作成・ルール変更・招待・退出確認を操作できる", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page.context());
  await page.goto("/start");
  await expect(page.locator("html")).toHaveAttribute("data-animic-scrollbars", "ready");
  await page.getByRole("textbox", { name: "表示名" }).fill("操作確認");
  await page.getByRole("button", { name: "ルームを作る", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
  await page
    .getByRole("radiogroup", { name: "難易度" })
    .getByText("むずかしい", { exact: true })
    .click();
  await expect(page.getByRole("radio", { name: "むずかしい", exact: true })).toBeChecked();
  await page.reload();
  await expect(page.getByRole("radio", { name: "むずかしい", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "招待する", exact: true }).first().click();
  await expect(page.getByRole("dialog", { name: "友だちを招待" })).toBeVisible();
  await expect(page.getByRole("img", { name: "ルームURLのQRコード" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "退出", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "やめる", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
});

test("接続中の2人以外では開始できず、URL指定で役割や結果を変更できない", async ({ page }) => {
  const code = await openLobby(page);
  await expect(page.getByRole("button", { name: "対戦をはじめる", exact: true })).toBeDisabled();
  await expect(page.getByText("接続中の参加者が2人のときに開始できます")).toBeVisible();
  await page.goto(`/rooms/${code}?name=偽名&role=guest&stage=result`);
  await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "対戦をはじめる", exact: true })).toBeDisabled();
  await expect(page.getByText("操作確認（あなた）", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "YOU WIN!" })).toHaveCount(0);
});

test("再読み込み後も対戦の開始時刻を保ち、期限後は未提出として確定する", async ({
  page,
  browser,
}) => {
  test.setTimeout(45000);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const guest = await context.newPage();
    const code = await openBattle(page, guest, {
      difficulty: "easy",
      durationSeconds: 5,
      selectionSeconds: 2,
    });
    await expect(page.getByRole("timer")).toBeVisible();
    const initial = await page.evaluate(
      async (value) =>
        (await window.animicTest.getRoomEntry({ data: { code: value } })).room?.battle,
      code,
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "この1枚で提出", exact: true })).toBeDisabled();
    const restored = await page.evaluate(
      async (value) =>
        (await window.animicTest.getRoomEntry({ data: { code: value } })).room?.battle,
      code,
    );
    expect(restored?.id).toBe(initial?.id);
    expect(restored?.generationEndsAt).toBe(initial?.generationEndsAt);
    await expect(page.getByRole("heading", { name: "NO GAME", exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("どちらも提出しなかったため、勝負不成立です")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "NO GAME", exact: true })).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
  } finally {
    await context.close();
  }
});

for (const viewport of [
  { width: 320, height: 480 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
]) {
  test(`対戦画面の画像・提出操作は文字200%でも見切れない（${viewport.width}px）`, async ({
    page,
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    try {
      await page.setViewportSize(viewport);
      const guest = await context.newPage();
      await openBattle(page, guest);
      await expect(page.getByRole("timer")).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const submit = page.getByRole("button", { name: "この1枚で提出", exact: true });
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
      await expect(submit).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    } finally {
      await context.close();
    }
  });
}
