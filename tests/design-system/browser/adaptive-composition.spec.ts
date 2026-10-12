import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectAccessible } from "./accessibility";

for (const width of [1440, 800, 390, 320]) {
  test(`アバター選択 ${width}px: 列と円形を維持し、選択とフォーカスを区別する`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/iframe.html?id=interactive-controls--avatar-choices&viewMode=story");
    const grid = page.getByTestId("avatar-choices");
    const choices = grid.getByRole("button");
    await expect(choices).toHaveCount(4);
    const boxes = await choices.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right };
      }),
    );
    for (const box of boxes) {
      expect(box.y).toBeCloseTo(boxes[0].y, 1);
      expect(box.width).toBeCloseTo(box.height, 1);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    const pink = choices.nth(0),
      cyan = choices.nth(1),
      yellow = choices.nth(2);
    await expect(page.getByTestId("choose-pink")).toHaveRole("button");
    await expect(pink).toHaveAccessibleDescription("選択中：pink");
    await expect(pink).toHaveAttribute("aria-pressed", "true");
    await cyan.click();
    await expect(cyan).toHaveAttribute("aria-pressed", "true");
    await expect(pink).toHaveAttribute("aria-pressed", "false");
    await expect(cyan).toHaveCSS("outline-style", "none");
    await expect(cyan).not.toHaveCSS("box-shadow", "none");
    await page.keyboard.press("Tab");
    await expect(yellow).toBeFocused();
    await expect(yellow).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Space");
    await expect(yellow).toHaveAttribute("aria-pressed", "true");
    await expect(choices.nth(3)).toBeDisabled();
    await expectAccessible(
      new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]),
    );
  });
}

test("画像と本文の操作は利用可能幅に応じて右側・本文下へ配置する", async ({ page }) => {
  await page.goto("/iframe.html?id=interactive-controls--profile-actions&viewMode=story");
  await expect(page.getByRole("heading", { name: "プロフィールの操作" })).toBeVisible();
  const profile = page.getByTestId("profile-actions");
  for (const width of [600, 400]) {
    await profile.evaluate((node, targetWidth) => {
      node.style.width = `${targetWidth}px`;
    }, width);
    const geometry = await profile.evaluate((node) => {
      const media = node.querySelector("[data-animic-media]")!.getBoundingClientRect();
      const content = node.querySelector("[data-animic-media-content]")!.getBoundingClientRect();
      const actions = node.querySelector("[data-animic-media-actions]")!.getBoundingClientRect();
      return {
        media: { x: media.x, right: media.right },
        content: { x: content.x, right: content.right, bottom: content.bottom },
        actions: { x: actions.x, y: actions.y },
      };
    });
    expect(geometry.content.x).toBeGreaterThan(geometry.media.right);
    if (width === 600) expect(geometry.actions.x).toBeGreaterThan(geometry.content.right);
    else {
      expect(geometry.actions.x).toBeCloseTo(geometry.content.x, 1);
      expect(geometry.actions.y).toBeGreaterThan(geometry.content.bottom);
    }
  }
  const adaptive = page.getByTestId("adaptive-profile");
  for (const width of [600, 220]) {
    await adaptive.evaluate((node, targetWidth) => {
      node.style.width = `${targetWidth}px`;
    }, width);
    const geometry = await adaptive.evaluate((node) => {
      const media = node.querySelector("[data-animic-media]")!.getBoundingClientRect();
      const content = node.querySelector("[data-animic-media-content]")!.getBoundingClientRect();
      return {
        mediaRight: media.right,
        mediaBottom: media.bottom,
        contentX: content.x,
        contentY: content.y,
      };
    });
    if (width === 600) expect(geometry.contentX).toBeGreaterThan(geometry.mediaRight);
    else expect(geometry.contentY).toBeGreaterThan(geometry.mediaBottom);
  }
  const group = page.getByRole("radiogroup", { name: "表示する期間" });
  await expect(group.locator(".animic-segmented-control__group")).toHaveCSS(
    "border-style",
    "solid",
  );
  await expect(group.locator(".animic-segmented-control__group")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  const radio = group.getByRole("radio", { name: "すべて" });
  await radio.focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "今週" })).toBeChecked();
});

test("比較用の2列はコンテナ境界で切り替わり、狭い領域では情報を先に読む", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/iframe.html?id=layout-boundaries--balanced-split&viewMode=story");
  const split = page.getByTestId("balanced-split");
  await expect(split).toBeVisible();
  for (const width of [831, 832, 833]) {
    await split.evaluate((node, targetWidth) => {
      node.style.width = `${targetWidth}px`;
    }, width);
    const geometry = await split.evaluate((node) => {
      const first = node.querySelector("[data-animic-split-first]")!.getBoundingClientRect();
      const second = node.querySelector("[data-animic-split-second]")!.getBoundingClientRect();
      return {
        first: { y: first.y, right: first.right, width: first.width },
        second: { x: second.x, y: second.y, bottom: second.bottom, width: second.width },
      };
    });
    if (width < 832) expect(geometry.first.y).toBeGreaterThan(geometry.second.bottom);
    else {
      expect(geometry.second.y).toBeCloseTo(geometry.first.y, 1);
      expect(geometry.second.x).toBeGreaterThan(geometry.first.right);
      expect(geometry.first.width / geometry.second.width).toBeCloseTo(1.1, 2);
    }
  }
});

test("集計値は5列・3列・2列に組み替え、値と単位がカード内に収まる", async ({ page }) => {
  await page.goto("/iframe.html?id=collections--aggregate-stats&viewMode=story");
  await expect(page.getByRole("heading", { name: "集計" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const [width, columns] of [
    [1440, 5],
    [800, 3],
    [390, 2],
    [320, 2],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    const stats = page.locator(".animic-stat-group__root");
    expect(
      await stats.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length),
    ).toBe(columns);
    const overflow = await page
      .locator(".animic-stat-group__item")
      .evaluateAll((nodes) => nodes.some((node) => node.scrollWidth > node.clientWidth + 1));
    expect(overflow).toBe(false);
  }
  await expect(page.getByText("1st", { exact: true })).toHaveCSS("font-style", "italic");
});

test("アバターの選択状態とキーボードフォーカスをforced-colorsでも識別できる", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/iframe.html?id=interactive-controls--avatar-choices&viewMode=story");
  const selected = page.getByRole("button", { name: "pinkを選択" });
  await selected.focus();
  await expect(selected).toHaveCSS("outline-style", "solid");
  expect(await selected.evaluate((node) => getComputedStyle(node, "::after").borderStyle)).toBe(
    "solid",
  );
  const other = page.getByRole("button", { name: "cyanを選択" });
  expect(await other.evaluate((node) => getComputedStyle(node, "::after").content)).toBe("none");
  await page.keyboard.press("Tab");
  await expect(other).toBeFocused();
  await page.keyboard.press("Space");
  await expect(other).toHaveAttribute("aria-pressed", "true");
  expect(await selected.evaluate((node) => getComputedStyle(node, "::after").content)).toBe("none");
});
