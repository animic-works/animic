import { expect, test } from "@playwright/test";
import { signIn } from "./api";

for (const input of ["pointer", "keyboard"] as const) {
  test(`ルーム作成の演出を${input === "pointer" ? "ボタン" : "キーボード"}でスキップできる`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page.context());
    await page.goto("/start");
    await expect(page.locator("html")).toHaveAttribute("data-animic-scrollbars", "ready");
    await page.getByRole("textbox", { name: "表示名" }).fill("スキップ確認");
    await page.getByRole("button", { name: "ルームを作る", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "ルームへ移動", exact: true });
    const skip = dialog.getByRole("button", { name: "演出をスキップしてロビーへ進む" });
    await expect(skip).toBeFocused();
    // Tabは演出を飛ばさず、背後のページにも移動しない。
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(dialog).toBeVisible();
    await expect(skip).toHaveCSS("outline-style", "none");
    await expect(skip).toHaveCSS("text-decoration-line", "none");
    await expect(skip.locator("..")).toHaveCSS("opacity", "1");
    await expect(skip).toBeInViewport();
    if (input === "pointer") {
      // 別の書体を取得中でも、操作済みのスキップをフォント待ちで止めない。
      await page.route("**/delayed-font.woff2", () => new Promise<void>(() => {}));
      await page.evaluate(() => {
        const font = new FontFace("Pending", 'url("/delayed-font.woff2")');
        document.fonts.add(font);
        void font.load();
      });
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loading");
      await skip.click();
    } else await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/rooms\/[A-Z2-9]{8}$/);
    await expect(dialog).toHaveCount(0, { timeout: 1000 });
    await expect(page.getByRole("heading", { name: "ルームコード", exact: true })).toBeVisible();
  });
}
