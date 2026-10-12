import { test, expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    heroTitleOpacities: number[];
    stopHeroTitleCapture: boolean;
  }
}

async function captureHeroTitle(page: Page) {
  await page.addInitScript(() => {
    window.heroTitleOpacities = [];
    const samples = window.heroTitleOpacities;
    window.stopHeroTitleCapture = false;
    function capture() {
      const node = document.querySelector("[data-hero-title]");
      if (node) samples.push(Number(getComputedStyle(node).opacity));
      if (!window.stopHeroTitleCapture) requestAnimationFrame(capture);
    }
    requestAnimationFrame(capture);
  });
}

test("通常の初回読み込みでもコピーを途中の透明度を経て一度だけ表示する", async ({ page }) => {
  await captureHeroTitle(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-hero-title]")).toHaveCSS("opacity", "1");
  const opacity = await page.evaluate(() => {
    window.stopHeroTitleCapture = true;
    return window.heroTitleOpacities;
  });
  expect(opacity[0]).toBe(0);
  expect(opacity.some((value) => value > 0 && value < 1)).toBe(true);
  expect(opacity.at(-1)).toBe(1);
  expect(opacity.every((value, index) => index === 0 || value >= opacity[index - 1])).toBe(true);
});

test("未取得の見出しフォントだけを待ち、文字と下線を一緒にフェードする", async ({ page }) => {
  await captureHeroTitle(page);
  let releaseFonts: (() => void) | undefined;
  let releaseScripts: (() => void) | undefined;
  const fonts = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  const scripts = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await scripts;
    if (/dela-gothic-one.*\.woff2/.test(route.request().url())) await fonts;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    const group = page.locator("[data-hero-title]");
    await expect(group).toHaveCSS("opacity", "0");
    await expect(page.locator("header")).not.toHaveAttribute("data-indicator-ready");
    await expect(page.getByRole("button", { name: "スタート", exact: true }).last()).toBeVisible();
    await page.waitForFunction(() => performance.getEntriesByType("paint").length > 0);
    releaseFonts?.();
    await expect(group).toHaveCSS("opacity", "1");
    const opacity = await page.evaluate(() => {
      window.stopHeroTitleCapture = true;
      return window.heroTitleOpacities;
    });
    expect(opacity.some((value) => value > 0 && value < 1)).toBe(true);
    expect(opacity.at(-1)).toBe(1);
    expect(opacity.every((value, index) => index === 0 || value >= opacity[index - 1])).toBe(true);
    await expect(group.locator("svg")).toHaveCount(1);
  } finally {
    releaseFonts?.();
    releaseScripts?.();
  }
});

test("キャッシュ済みの再読み込みでは見出しをフェードし直さない", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.reload({ waitUntil: "networkidle" });
  const group = page.locator("[data-hero-title]");
  await expect(group).toHaveAttribute("data-font-state", "visible");
  await expect(group).toHaveCSS("opacity", "1");
  await expect(group).toHaveCSS("animation-name", "none");
});

test("見出しフォントが停滞しても待機期限後は表示する", async ({ page }) => {
  let releaseFonts: (() => void) | undefined;
  const fonts = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  await page.route(/dela-gothic-one.*\.woff2/, async (route) => {
    await fonts;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const group = page.locator("[data-hero-title]");
    await expect(group).toHaveCSS("opacity", "1", { timeout: 3000 });
    releaseFonts?.();
    await page.evaluate(() => document.fonts.ready);
    await expect(group).toHaveCSS("opacity", "1");
  } finally {
    releaseFonts?.();
  }
});
