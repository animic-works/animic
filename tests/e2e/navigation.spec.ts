import { test, expect } from "@playwright/test";
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });
test.describe("ナビゲーションとスクロール", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
  });
  test("初回の下線は表示済みで、セクション切替では共有バーを移動する", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const bar = page.locator(".animic-navigation-bar__indicator");
    const navigation = page.getByRole("navigation", { name: "メインメニュー" });
    const home = await navigation.getByRole("link", { name: "ホーム", exact: true }).boundingBox();
    await expect(bar).toBeVisible();
    expect((await bar.boundingBox())?.x).toBeCloseTo(home!.x, 0);
    const frames = await page.evaluate(async () => {
      const nav = document.querySelector('nav[aria-label="メインメニュー"]')!;
      const indicator = document.querySelector(".animic-navigation-bar__indicator")!;
      const start = indicator.getBoundingClientRect().x;
      const destination = nav.querySelector<HTMLAnchorElement>('a[href="#how"]')!;
      const end = destination.getBoundingClientRect().x;
      const samples: { x: number; opacity: string }[] = [];
      destination.click();
      const until = performance.now() + 1600;
      while (performance.now() < until) {
        await new Promise(requestAnimationFrame);
        samples.push({
          x: indicator.getBoundingClientRect().x,
          opacity: getComputedStyle(indicator).opacity,
        });
      }
      return { start, end, samples };
    });
    expect(frames.samples.some(({ x }) => x > frames.start + 2 && x < frames.end - 2)).toBe(true);
    expect(frames.samples.every(({ opacity }) => opacity === "1")).toBe(true);
    expect(frames.samples.at(-1)?.x).toBeCloseTo(frames.end, 0);
    await expect(navigation.getByRole("link", { name: "遊び方" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });
  test("モーダルを開閉しても固定ナビと本文の横位置が変わらない", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
    const nav = page.locator("header").first();
    const before = await nav.boundingBox();
    await page.getByRole("button", { name: "ルームに参加", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await nav.boundingBox()).toEqual(before);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await nav.boundingBox()).toEqual(before);
  });
});

test("ナビの初期選択の線はJavaScriptの起動前からフェードなしで表示する", async ({ page }) => {
  let releaseScripts: (() => void) | undefined;
  const pendingScripts = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await pendingScripts;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    const home = page
      .getByRole("navigation", { name: "メインメニュー" })
      .getByRole("link", { name: "ホーム", exact: true });
    await expect(home).toBeVisible();
    await expect(page.locator("header")).not.toHaveAttribute("data-indicator-ready");
    const line = await home.evaluate((node) => {
      const style = getComputedStyle(node, "::after");
      return {
        content: style.content,
        display: style.display,
        opacity: style.opacity,
        animation: style.animationName,
      };
    });
    expect(line).toEqual({ content: '""', display: "block", opacity: "1", animation: "none" });
    releaseScripts?.();
    await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
    await expect(page.locator(".animic-navigation-bar__indicator")).toHaveCSS(
      "animation-name",
      "none",
    );
  } finally {
    releaseScripts?.();
  }
});

for (const width of [900, 720, 600]) {
  test(`ナビの折り返し幅でも初期表示後にロゴとキャラを動かさない（${width}px）`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    let releaseScripts: (() => void) | undefined;
    const pendingScripts = new Promise<void>((resolve) => {
      releaseScripts = resolve;
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text());
    });
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "script") await pendingScripts;
      await route.continue();
    });
    const bounds = () =>
      page
        .locator('#top h1, #top h2, #top p, #top button, [data-testid="hero-artwork"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
    try {
      await page.goto("/", { waitUntil: "commit" });
      await expect(page.locator("#top h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("header")).not.toHaveAttribute("data-indicator-ready");
      const before = await bounds();
      releaseScripts?.();
      await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
      await page.evaluate(() => document.fonts.ready);
      expect(await bounds()).toEqual(before);
      expect(errors).toEqual([]);
    } finally {
      releaseScripts?.();
    }
  });
}

test("遠いリンクへ直接移動し、中間セクションで下線を停めない", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  const samples = await page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="メインメニュー"]')!;
    nav.querySelector<HTMLAnchorElement>('a[href="#gallery"]')!.click();
    const frames: string[] = [];
    const until = performance.now() + 1400;
    while (performance.now() < until) {
      await new Promise(requestAnimationFrame);
      frames.push(nav.querySelector('[aria-current="location"]')?.textContent ?? "");
    }
    return frames;
  });
  expect(new Set(samples)).toEqual(new Set(["ギャラリー"]));
  await expect
    .poll(() => page.locator("#gallery").evaluate((n) => Math.abs(n.getBoundingClientRect().top)))
    .toBeLessThan(1);
});

test("ブランド表示でナビ幅が変わっても、移動中の下線を連続して切り替える", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  const result = await page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="メインメニュー"]')!;
    const indicator = document.querySelector(".animic-navigation-bar__indicator")!;
    const x = () => indicator.getBoundingClientRect().x;
    const start = x();
    nav.querySelector<HTMLAnchorElement>('a[href="#gallery"]')!.click();
    await new Promise(requestAnimationFrame);
    const first = x();
    for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
    const beforeRetarget = x();
    nav.querySelector<HTMLAnchorElement>('a[href="#how"]')!.click();
    await new Promise(requestAnimationFrame);
    const afterRetarget = x();
    return { start, first, beforeRetarget, afterRetarget };
  });
  expect(Math.abs(result.first - result.start)).toBeLessThan(2);
  expect(Math.abs(result.afterRetarget - result.beforeRetarget)).toBeLessThan(45);
  const destination = page
    .getByRole("navigation", { name: "メインメニュー" })
    .getByRole("link", { name: "遊び方", exact: true });
  await expect(destination).toHaveAttribute("aria-current", "location");
  await expect
    .poll(async () => {
      const bar = (await page.locator(".animic-navigation-bar__indicator").boundingBox())!;
      const link = (await destination.boundingBox())!;
      return Math.abs(bar.x - link.x) + Math.abs(bar.width - link.width);
    })
    .toBeLessThan(1);
});

test("ハッシュ直アクセスは起動前から目的地と下線を即時表示する", async ({ page }) => {
  let release!: () => void;
  const scripts = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await scripts;
    await route.continue();
  });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto("/#gallery", { waitUntil: "commit" });
    const nav = page.getByRole("navigation", { name: "メインメニュー" });
    const link = nav.getByRole("link", { name: "ギャラリー" });
    await expect(link).toHaveAttribute("aria-current", "location");
    const sideLink = page
      .getByRole("navigation", { name: "ページ内の移動" })
      .getByRole("link", { name: "ギャラリー", exact: true });
    await expect(sideLink).toHaveAttribute("aria-current", "location");
    await expect
      .poll(() => page.locator("#gallery").evaluate((n) => Math.abs(n.getBoundingClientRect().top)))
      .toBeLessThan(1);
    expect(await link.evaluate((n) => getComputedStyle(n, "::after").content)).toBe('""');
    // 初期位置の本文を、JavaScriptの起動待ちで隠さない。
    const content = await page.locator("#gallery [data-order]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          opacity: style.opacity,
          transform: style.transform,
        };
      }),
    );
    expect(content.length).toBeGreaterThan(0);
    for (const item of content) expect(item).toEqual({ opacity: "1", transform: "none" });
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
    release();
    await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
    await expect(link).toHaveAttribute("aria-current", "location");
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});

test("snapでハッシュを置き換え、ナビ操作だけを戻る履歴に追加する", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  const initialHistory = await page.evaluate(() => history.length);
  await page.locator("#gallery").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page).toHaveURL(/\/#gallery$/);
  expect(await page.evaluate(() => history.length)).toBe(initialHistory);
  await page.reload();
  await expect
    .poll(() =>
      page.locator("#gallery").evaluate((node) => Math.abs(node.getBoundingClientRect().top)),
    )
    .toBeLessThan(1);
  await page
    .getByRole("navigation", { name: "メインメニュー" })
    .getByRole("link", { name: "遊び方" })
    .click();
  await expect(page).toHaveURL(/\/#how$/);
  await expect
    .poll(() => page.locator("#how").evaluate((node) => Math.abs(node.getBoundingClientRect().top)))
    .toBeLessThan(1);
  expect(await page.evaluate(() => history.length)).toBe(initialHistory + 1);
  await page.goBack();
  await expect(page).toHaveURL(/\/#gallery$/);
  await expect
    .poll(() =>
      page.locator("#gallery").evaluate((node) => Math.abs(node.getBoundingClientRect().top)),
    )
    .toBeLessThan(1);
});

test("ハッシュを外して再読み込みした場合は保存位置へ戻らず先頭を表示する", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  await page.locator("#how").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page).toHaveURL(/\/#how$/);
  await page.evaluate(() => history.replaceState(history.state, "", "/"));
  await page.reload();
  await expect(page.locator("header")).toHaveAttribute("data-indicator-ready");
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(
    page
      .getByRole("navigation", { name: "メインメニュー" })
      .getByRole("link", { name: "ホーム", exact: true }),
  ).toHaveAttribute("aria-current", "location");
});

test("幅が足りなければ短縮してから折り返し、操作を複製しない", async ({ page }) => {
  await page.goto("/#how", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator("header");
  const join = header.getByRole("button", { name: "ルームに参加", exact: true });
  const compact = join.locator('[data-animic-button-label="compact"]');
  const full = join.locator('[data-animic-button-label="full"]');
  const links = header.getByRole("navigation", { name: "メインメニュー" });
  const settleLayout = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const isInline = async () => {
    const navigation = (await links.boundingBox())!;
    const button = (await join.boundingBox())!;
    return button.y < navigation.y + navigation.height;
  };
  await expect(join).toHaveCount(1);
  // 操作数や文言で境界は変わるため、固定の幅ではなく最初の短縮を確認する。
  for (let width = 1000; width >= 570; width -= 10) {
    await page.setViewportSize({ width, height: 900 });
    await settleLayout();
    expect(await isInline()).toBe(true);
    if (await compact.isVisible()) break;
  }
  await expect(compact).toBeVisible();
  await expect(full).toBeHidden();

  // 狭い画面のリンク省略より前に、文字の拡大でも折り返せることを確認する。
  for (let percent = 110; percent <= 200; percent += 10) {
    await page.evaluate((value) => {
      document.documentElement.style.fontSize = `${value}%`;
    }, percent);
    await settleLayout();
    if (!(await isInline())) break;
  }
  expect(await isInline()).toBe(false);
  await expect(full).toBeVisible();
  await expect(compact).toBeHidden();
  await expect(links.getByRole("link")).toHaveCount(4);
  await expect(join).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewportSize({ width: 1000, height: 900 });
  await expect.poll(isInline).toBe(true);
  await expect(full).toBeVisible();
  await expect(compact).toBeHidden();
  await expect(join).toHaveCount(1);
});

test("リンク列の再表示とリサイズでは下線を飛ばさず、その場に配置する", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/#how", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 920, 650, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const samples = await page.evaluate(async () => {
      const bar = document.querySelector<HTMLElement>("[data-animic-navigation-indicator]")!;
      const selected = document.querySelector<HTMLElement>('header nav [aria-current="location"]')!;
      const frames = [];
      for (let i = 0; i < 6; i++) {
        await new Promise(requestAnimationFrame);
        const a = selected.getBoundingClientRect(),
          b = bar.getBoundingClientRect();
        if (a.width)
          frames.push({
            dx: b.x - a.x,
            dy: b.bottom - a.bottom,
            animations: bar.getAnimations().length,
          });
      }
      return frames;
    });
    for (const sample of samples) {
      expect(Math.abs(sample.dx)).toBeLessThan(1);
      expect(Math.abs(sample.dy)).toBeLessThan(1);
      expect(sample.animations).toBe(0);
    }
  }
});
