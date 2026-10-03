import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// 画面のアクセシビリティを自動で確かめる（ラベル・名前・コントラスト・ARIAの使い方など）。
// 匿名参加の回数制限がほかのテストと合算されないよう、送信元を分ける
const ip = (n: number) => ({ extraHTTPHeaders: { "CF-Connecting-IP": `203.0.113.${n}` } });
test.use(ip(20));
// 現れる途中の半透明の文字をコントラスト不足と判定しないよう、動きを止めて検査する
test.use({ reducedMotion: "reduce" });

async function expectNoViolations(page: Page) {
  // 現れる途中の要素を半透明のまま検査しないよう、動きが終わるのを待つ
  // 途中で取り消された動き（finished が AbortError で失敗する）は待たずに進み、
  // 繰り返す動きが残っていても長く待たない
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
      ),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]),
  );
  // 色のコントラストは、画面モックの色（ピンクの地に白い文字など）をそのまま使う方針のため検査しない（docs/design.md）
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

// ログイン方法の選択から表示名の入力へ進む
async function proceedToName(page: Page) {
  await page.getByRole("button", { name: "ログインせずに進む" }).click();
  await expect(page.getByRole("heading", { name: "表示名を決めよう" })).toBeVisible();
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    test("トップの各画面", async ({ page }) => {
      await page.goto("/");
      await expectNoViolations(page);
      for (const hash of ["how", "score", "gallery"]) {
        await page.goto(`/#${hash}`);
        await expect(page).toHaveURL(new RegExp(`#${hash}$`));
        await expectNoViolations(page);
      }
      await page.goto("/");
      await page.getByRole("button", { name: "ルームに参加する" }).click();
      await expect(page.getByRole("dialog", { name: "ルームに参加" })).toBeVisible();
      await expectNoViolations(page);
    });

    test("利用規約", async ({ page }) => {
      await page.goto("/terms");
      await expectNoViolations(page);
    });

    test("ルームを作る画面と、作ったあとの待機画面", async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto("/rooms/new");
      await expectNoViolations(page);
      await proceedToName(page);
      await expectNoViolations(page);
      await page.getByLabel("表示名", { exact: true }).fill("ホスト");
      await page.getByRole("button", { name: "ルームを作る" }).click();
      // 帯の演出が終わってから検査する
      await expect(page.getByRole("status").filter({ hasText: "接続済み" })).toHaveCount(1, {
        timeout: 20_000,
      });
      await expect(page.locator("[data-wipe]")).toHaveCount(0, { timeout: 10_000 });
      await expectNoViolations(page);
      await page.getByRole("button", { name: "招待する" }).first().click();
      await expect(page.getByRole("dialog", { name: "友だちを招待" })).toBeVisible();
      await expectNoViolations(page);
    });
  });
}

test("送信に失敗したときのエラー表示", async ({ page }) => {
  await page.route("**/_serverFn/**", (route) => route.fulfill({ status: 500, body: "error" }));
  await page.goto("/rooms/new");
  await proceedToName(page);
  await page.getByLabel("表示名", { exact: true }).fill("ホスト");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page.getByRole("textbox", { name: "表示名" })).toHaveAttribute(
    "aria-invalid",
    "true",
    { timeout: 15_000 },
  );
  await expectNoViolations(page);
});
