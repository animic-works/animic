import { expect, test } from "@playwright/test";
import { openLobby } from "../fixtures/room-presentation";
import { executeLocalD1 } from "./d1";

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => {
  await executeLocalD1("DELETE FROM rate_limit");
});

for (const width of [1440, 900, 390, 320]) {
  test(`ルールの選択肢は幅を揃え、表示と選択状態を保つ (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const code = await openLobby(page);
    const difficulty = page.getByRole("radiogroup", { name: "難易度" });
    await expect(difficulty).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const boxes = [];
    for (const name of ["難易度", "制限時間", "画像選択の猶予"]) {
      const group = page.getByRole("radiogroup", { name });
      const items = group.locator("label");
      const bounds = await items.evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().toJSON()),
      );
      expect(
        Math.max(...bounds.map((b) => b.width)) - Math.min(...bounds.map((b) => b.width)),
      ).toBeLessThan(1);
      expect(
        Math.max(...bounds.map((b) => b.y)) - Math.min(...bounds.map((b) => b.y)),
      ).toBeLessThan(1);
      if (width <= 560) expect(Math.min(...bounds.map((b) => b.height))).toBeGreaterThanOrEqual(40);
      boxes.push(await items.first().locator("..").boundingBox());
    }
    expect(Math.max(...boxes.map((b) => b!.x)) - Math.min(...boxes.map((b) => b!.x))).toBeLessThan(
      1,
    );
    expect(
      Math.max(...boxes.map((b) => b!.width)) - Math.min(...boxes.map((b) => b!.width)),
    ).toBeLessThan(1);
    await difficulty.locator("label").filter({ hasText: "ふつう" }).click();
    await expect(difficulty.getByRole("radio", { name: "ふつう", exact: true })).toBeChecked();
    await expect(difficulty.locator("label").filter({ hasText: "ふつう" })).toHaveCSS(
      "outline-style",
      "none",
    );
    await page.keyboard.press("ArrowRight");
    await expect(difficulty.getByRole("radio", { name: "むずかしい", exact: true })).toBeChecked();
    await page.reload();
    await expect(difficulty.getByRole("radio", { name: "むずかしい", exact: true })).toBeChecked();
    await expect(page).toHaveURL(new RegExp(`/rooms/${code}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  });
}

for (const width of [1440, 390]) {
  test(`小型モーダルの見出しと説明を共通の中央揃えで表示する (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openLobby(page);
    await expect(page.getByRole("radiogroup", { name: "難易度" })).toBeVisible();
    for (const [trigger, title] of [
      ["退出", "ルームを出ますか？"],
      ["招待する", "友だちを招待"],
    ]) {
      await page
        .getByRole("button", { name: trigger, exact: true })
        .filter({ visible: true })
        .first()
        .click();
      const dialog = page.getByRole("dialog", { name: title, exact: true });
      const heading = dialog.getByRole("heading", { name: title, exact: true });
      await expect(heading).toHaveCSS("text-align", "center");
      await expect(dialog.locator('[data-part="description"]')).toHaveCSS("text-align", "center");
      const position = await heading.evaluate((node) => {
        const headingBox = node.getBoundingClientRect();
        const dialogBox = node.closest('[role="dialog"]')!.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          heading: headingBox.x + headingBox.width / 2,
          dialog: dialogBox.x + dialogBox.width / 2,
          paddingStart: style.paddingInlineStart,
          paddingEnd: style.paddingInlineEnd,
        };
      });
      expect(Math.abs(position.heading - position.dialog)).toBeLessThan(1);
      expect(position.paddingStart).toBe(position.paddingEnd);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });
}
