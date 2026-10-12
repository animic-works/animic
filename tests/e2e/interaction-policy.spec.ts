import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 1440, height: 900 },
  launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] },
});

test("クリックからのフォーカス復帰とキーボード操作を区別する", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  const trigger = page.getByRole("button", { name: "ルームに参加", exact: true });
  const dialog = page.getByRole("dialog");
  await trigger.click();
  await expect(dialog.locator("[data-active]")).toHaveCSS("box-shadow", "none");
  await dialog.getByRole("button", { name: "やめる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "none");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await page.keyboard.press("Tab");
  const cancel = dialog.getByRole("button", { name: "やめる" });
  await expect(cancel).toBeFocused();
  await expect(cancel).toHaveCSS("outline-style", "none");
  await expect(cancel).toHaveCSS("text-decoration-line", "underline");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
});

test("オーバーレイのトラックは1ページ送り、ドラッグとキー操作でもネイティブ領域を動かす", async ({
  page,
}) => {
  await page.goto("/");
  const bar = page.getByRole("scrollbar", { name: "ページ（縦スクロール）" });
  await expect(bar).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(1440);
  const box = (await bar.boundingBox())!;
  expect(box.y).toBe(0);
  expect(box.height).toBe(900);
  expect(box.x + box.width).toBe(1440);
  const thumb = bar.locator("div");
  const initialHandle = (await thumb.boundingBox())!;
  expect(initialHandle.x + initialHandle.width / 2).toBe(box.x + box.width / 2);
  expect(initialHandle.y).toBe(box.y);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 20);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(900);
  await expect(bar).toHaveAttribute("aria-valuenow", "900");
  await bar.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(1800);
  await bar.press("Shift+Space");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(900);
  await bar.press("End");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(2700);
  await expect
    .poll(async () => {
      const handle = (await thumb.boundingBox())!;
      return handle.y + handle.height;
    })
    .toBe(900);
  await bar.press("Home");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const handle = (await thumb.boundingBox())!;
  await page.mouse.move(handle.x + 2, handle.y + 10);
  await page.mouse.down();
  await page.mouse.move(handle.x + 2, handle.y + 450, { steps: 12 });
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
  await page.mouse.up();
  await expect(page.locator("html")).not.toHaveAttribute("data-animic-scroll-dragging");
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "y mandatory");
});

test("ダイアログのスクロールバーもフォーカストラップ内で操作できる", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 250 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-animic-scrollbars", "ready");
  await page.getByRole("button", { name: "ルームに参加する", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const bar = dialog.getByRole("scrollbar", { name: "ルームに参加（縦スクロール）" });
  await expect(bar).toBeVisible();
  await expect(page.getByRole("scrollbar", { name: "ページ（縦スクロール）" })).toHaveCount(0);
  await bar.focus();
  await bar.press("End");
  await expect.poll(() => dialog.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  await bar.press("Tab");
  expect(await dialog.evaluate((n) => n.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("scrollbar", { name: "ページ（縦スクロール）" })).toBeVisible();
});

test("forced-colorsとJavaScriptなしではネイティブスクロールバーを使う", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("scrollbar-width", "auto");
  await expect(page.getByRole("scrollbar")).toBeHidden();
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const native = await context.newPage();
    await native.goto("/");
    await expect(native.locator("html")).toHaveCSS("scrollbar-width", "auto");
  } finally {
    await context.close();
  }
});

test("リサイズ中もトラックを画面端へ固定し、上下端と中心軸を保つ", async ({ page }) => {
  await page.goto("/");
  const track = page.getByRole("scrollbar", { name: "ページ（縦スクロール）" });
  await expect(track).toBeVisible();
  for (const [width, height] of [
    [1000, 700],
    [390, 844],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    const box = (await track.boundingBox())!;
    const thumb = (await track.locator("div").boundingBox())!;
    expect(box.y).toBe(0);
    expect(box.height).toBe(height);
    expect(box.x + box.width).toBe(width);
    expect(thumb.x + thumb.width / 2).toBe(box.x + box.width / 2);
  }
});
