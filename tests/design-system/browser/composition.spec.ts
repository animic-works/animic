import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAccessible } from "./accessibility";

for (const story of [
  "actions",
  "introduction",
  "code-entry",
  "floating-content",
  "slides",
  "page-layout",
  "responsive-actions",
  "layers",
  "content-layout",
]) {
  test(`${story}: 表示とアクセシビリティ`, async ({ page }) => {
    await page.goto(
      `/iframe.html?id=composition--${story}&viewMode=story&globals=a11y.manual:!true`,
    );
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expectAccessible(
      new AxeBuilder({ page })
        .include("main")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]),
    );
  });
}

test("CTAは鮮やかなピンクと大きな白文字を使い、disabledとfocusが共存する", async ({ page }) => {
  await page.goto("/iframe.html?id=composition--actions&viewMode=story");
  const button = page.getByRole("button", { name: "スタート", exact: true }).first();
  await expect(button).toHaveCSS("background-color", "rgb(255, 45, 135)");
  await expect(button).toHaveCSS("font-size", "24px");
  await expect(button).toHaveCSS("border-radius", "9999px");
  const height = await button.evaluate((node) => node.getBoundingClientRect().height);
  expect(height).toBeGreaterThan(75);
  expect(height).toBeLessThan(78);
  await button.focus();
  await expect(button).toHaveCSS("outline-style", "solid");
  await expect(page.getByRole("button", { name: "無効な操作" })).toHaveCSS(
    "background-color",
    "color(srgb 1 0.711765 0.835294)",
  );
  const fonts = await page.evaluate(async () => {
    const faces = await document.fonts.load('italic 800 12px "Montserrat"', "HOW TO PLAY");
    return faces.map((face) => ({ status: face.status, style: face.style }));
  });
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every((face) => face.status === "loaded" && face.style === "italic")).toBe(true);
});

test("コード入力は単一の入力欄で貼り付け・選択範囲の編集・エラーを扱う", async ({
  page,
  context,
}) => {
  await page.goto("/iframe.html?id=composition--code-entry&viewMode=story");
  const input = page.getByRole("textbox", { name: "確認コード", exact: true });
  await expect(input).toHaveAccessibleDescription("8文字で入力してください");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("abcd2345"));
  await input.focus();
  await page.keyboard.press("Control+V");
  await expect(input).toHaveValue("ABCD2345");
  const cell = page.locator(".animic-code-input__cell").nth(4);
  const cellBox = await cell.boundingBox();
  if (!cellBox) throw new Error("コード入力のセルが見つかりません。");
  await page.mouse.click(cellBox.x + 4, cellBox.y + cellBox.height / 2);
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(4);
  await page.keyboard.press("ArrowLeft");
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);
  await input.evaluate((node: HTMLInputElement) => {
    node.focus();
    node.setSelectionRange(2, 4);
  });
  await page.keyboard.insertText("XY");
  await expect(input).toHaveValue("ABXY2345");
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Control+C");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("ABXY2345");
  await input.fill("!");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "無効なコード" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "参照専用のコード" })).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByRole("button", { name: "入力を開く" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox")).toBeFocused();
  expect(await dialog.evaluate((node) => node.getBoundingClientRect().width)).toBeLessThanOrEqual(
    400,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "入力を開く" })).toBeFocused();
});

test("Popoverは操作で開閉し、画面内に収まり、閉じるとfocusを戻す", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=composition--floating-content&viewMode=story&globals=a11y.manual:!true",
  );
  const trigger = page.getByRole("button", { name: "プロフィールを開く" });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "プロフィール" });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("animation-name", "none");
  const box = await panel.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(15);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(305);
  await expect(page.locator(".animic-popover__positioner")).toHaveCSS("z-index", "10");
  await expectAccessible(
    new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]),
  );
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("Carouselの循環・キーボード・横スワイプとMeterの読み上げ", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/iframe.html?id=composition--slides&viewMode=story");
  const carousel = page.getByRole("region", { name: "手順の一覧" });
  await page.getByRole("button", { name: "前の手順" }).click();
  await expect(page.getByRole("heading", { name: "比べる" })).toBeVisible();
  await page.getByRole("button", { name: "次の手順" }).click();
  await expect(page.getByRole("heading", { name: "集まる" })).toBeVisible();
  await carousel.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "選ぶ" })).toBeVisible();
  await carousel.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 200, clientY: 200 }],
  });
  await carousel.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: 100, clientY: 200 }],
  });
  await expect(page.getByRole("heading", { name: "作る" })).toBeVisible();
  await expect(page.getByRole("link", { name: "詳しく見る" })).toHaveCount(1);
  await expect(page.locator(".animic-carousel__item[data-moving]").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
  const meter = page.getByRole("meter", { name: "再現度" });
  await expect(meter).toHaveAttribute("aria-valuenow", "92.4");
  await expect(meter).toHaveAttribute("aria-valuetext", "92.4%");
});

test("Pageのスクロール指定と狭い画面の2列比較・操作領域", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/iframe.html?id=composition--page-layout&viewMode=story");
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "y mandatory");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(page.getByRole("navigation", { name: "ページ内の案内" })).not.toBeVisible();
  const header = page.locator("header");
  await expect(header).toBeVisible();
  await expect(header).toHaveCSS("z-index", "1");
  const pair = page.locator("[data-animic-image-pair-layout] > *");
  const left = await pair.nth(0).boundingBox();
  const right = await pair.nth(1).boundingBox();
  expect(left?.y).toBe(right?.y);
  expect(right?.x).toBeGreaterThan((left?.x ?? 0) + (left?.width ?? 0));
  await page.getByRole("button", { name: "区切りで止まる動作を切り替える" }).click();
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
  await page.getByRole("button", { name: "狭い画面の案内を切り替える" }).click();
  await expect(header).not.toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const overflow = await page.evaluate(() => {
    const pageElement = document.querySelector("[data-animic-page]");
    return pageElement ? pageElement.scrollWidth - pageElement.clientWidth : Infinity;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("heading", { name: "2枚を比較する" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "2枚を比較する" })).toBeInViewport();
});

test("操作と強調文字は画面の幅が変わっても意味と親の書式を保つ", async ({ page }) => {
  await page.goto("/iframe.html?id=composition--responsive-actions&viewMode=story");
  const primary = page.getByRole("button", { name: "選択する", exact: true });
  const secondary = page.getByRole("button", { name: "選択を戻す", exact: true });
  const heading = page.getByRole("heading");
  await expect(page.getByText("大事な部分", { exact: true })).toHaveCSS("font-weight", "700");
  const number = page.getByText("合計0", { exact: true });
  await expect(number.locator("span")).toHaveCSS("font-style", "italic");
  await expect(number.locator("span")).toHaveCSS(
    "color",
    await number.evaluate((node) => getComputedStyle(node).color),
  );
  for (const width of [1440, 560, 561, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(primary).toHaveCSS(
      "font-size",
      width <= 560 ? "16px" : width <= 900 ? "17.6px" : "24px",
    );
    await expect(primary).toHaveCSS("background-color", "rgb(255, 45, 135)");
    await expect(primary).toHaveAccessibleName("選択する");
    await primary.click();
    await secondary.click();
    await expect(page.getByText("合計0", { exact: true })).toBeVisible();
    const typography = await heading.evaluate((node) => {
      const parent = getComputedStyle(node);
      const child = getComputedStyle(node.querySelector("span")!);
      return ["font-family", "font-size", "font-weight", "line-height", "letter-spacing"].map(
        (key) => [parent.getPropertyValue(key), child.getPropertyValue(key)],
      );
    });
    for (const [parent, child] of typography) expect(child).toBe(parent);
  }
  await expect(page.getByRole("button", { name: "無効な選択" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "無効な選択" })).toHaveCSS(
    "background-color",
    "color(srgb 1 0.711765 0.835294)",
  );
  await expect(page.getByRole("button", { name: "保存中" })).toHaveAttribute("aria-busy", "true");
  await primary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("合計1", { exact: true })).toBeVisible();
  await expectAccessible(
    new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]),
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const bounds = await secondary.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  const labelFits = await secondary.evaluate((node) => node.scrollWidth <= node.clientWidth);
  expect(labelFits).toBe(true);
});

test("装飾の重なりから縦並びへ切り替えても操作の順序とナビを維持する", async ({ page }) => {
  await page.goto("/iframe.html?id=composition--layers&viewMode=story");
  const root = page.getByTestId("layers");
  const artwork = root.locator('[data-animic-layer="artwork"]');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(artwork).toHaveCSS("position", "absolute");
  await expect(root).toHaveCSS("isolation", "isolate");
  await expect(artwork).toHaveAttribute("inert", "");
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(artwork).toHaveCSS("position", "relative");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(artwork).toHaveCSS("position", "relative");
  await expect(page.getByRole("button", { name: "選ぶ", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation")).not.toBeVisible();
  const profile = page.getByRole("link", { name: "プロフィール", exact: true });
  await expect(profile.locator("span")).not.toBeVisible();
  expect((await profile.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  const elements = await root
    .locator(":scope > :not([data-animic-layer=background])")
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  expect(elements[1].y).toBeGreaterThanOrEqual(elements[0].bottom);
  expect(elements[2].y).toBeGreaterThanOrEqual(elements[1].bottom);
  await profile.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "内容を確認", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
    window.scrollTo(0, 0);
  });
  await expect
    .poll(async () => {
      const header = await page.locator("header").boundingBox();
      const content = await root.boundingBox();
      return content!.y - header!.height;
    })
    .toBeGreaterThanOrEqual(16);
});

test("見出し付きの2列とカード一覧は選択肢の組み合わせでも配置を維持する", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=composition--content-layout&viewMode=story&globals=a11y.manual:!true",
  );
  const split = page.getByTestId("content-split");
  const header = split.locator("[data-animic-split-header]");
  const details = split.locator("[data-animic-split-first]");
  const pictures = split.locator("[data-animic-split-second]");
  const grid = page.getByTestId("single-grid").locator("[data-animic-grid-layout]");
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const heading = (await header.boundingBox())!;
    const info = (await details.boundingBox())!;
    const media = (await pictures.boundingBox())!;
    if (width === 1440) {
      expect(media.x).toBeGreaterThan(info.x + info.width);
      expect(Math.abs(media.y - heading.y)).toBeLessThan(1);
      expect(info.y).toBeGreaterThan(heading.y);
    } else {
      expect(media.y).toBeGreaterThanOrEqual(heading.y + heading.height);
      expect(info.y).toBeGreaterThanOrEqual(media.y + media.height);
    }
    await expect(page.getByTestId("adaptive-cluster")).toHaveCSS(
      "flex-direction",
      width === 390 ? "column" : "row",
    );
    const columns = await grid.evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(width === 1440 ? 3 : 1);
    expect(
      await grid.evaluate((node) => parseFloat(getComputedStyle(node).rowGap)),
    ).toBeGreaterThan(0);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const navigation = page.getByRole("navigation", { name: "内容の案内" });
  const detailLink = navigation.getByRole("link", { name: "詳細" });
  await detailLink.focus();
  await page.keyboard.press("Enter");
  await expect(detailLink).toHaveAttribute("aria-current", "location");
  await expect(detailLink).toHaveCSS("outline-style", "solid");
});

test("導入文の強調とクリックの反応が狭い画面でも動く", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/iframe.html?id=composition--introduction&viewMode=story");
  await expect(page.getByRole("heading", { name: "画像で遊ぼう" })).toBeVisible();
  await expect(page.locator("main strong")).toHaveCSS("color", "rgb(255, 45, 135)");
  await expect(page.locator("main mark")).toHaveCSS("background-image", /linear-gradient/);
  const button = page.getByRole("button", { name: "試してみる" });
  const animation = button.evaluate(
    (node) =>
      new Promise<number>((resolve) => {
        node.addEventListener(
          "animationstart",
          () => resolve(parseFloat(getComputedStyle(node).animationDuration) * 1000),
          { once: true },
        );
      }),
  );
  await button.click();
  expect(await animation).toBe(350);
  await expect(button).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button.click();
  await expect(button).toHaveCSS("animation-name", "none");
});
