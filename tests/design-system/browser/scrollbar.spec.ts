import { test, expect } from "@playwright/test";

test("入力の増減にスクロールバーが追従し、本文の幅を変えない", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--inputs&viewMode=story");
  const input = page.getByRole("textbox", { name: "説明", exact: true });
  const initial = (await input.boundingBox())!;
  await input.fill(Array.from({ length: 40 }, (_, i) => `入力の${i + 1}行目`).join("\n"));
  const bar = page.getByRole("scrollbar", { name: "入力内容（縦スクロール）" });
  await expect(bar).toBeVisible();
  expect((await input.boundingBox())!.width).toBe(initial.width);
  const viewport = await input.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { top: box.top + node.clientTop, height: node.clientHeight };
  });
  const track = (await bar.boundingBox())!;
  expect(track.y).toBe(viewport.top);
  expect(track.height).toBe(viewport.height);
  const thumb = (await bar.locator("div").boundingBox())!;
  expect(thumb.x + thumb.width / 2).toBe(track.x + track.width / 2);
  await bar.press("Home");
  await expect.poll(() => input.evaluate((n) => n.scrollTop)).toBe(0);
  await bar.press("End");
  await expect
    .poll(() => input.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop))
    .toBe(0);
  await input.fill("短い入力");
  await expect(bar).toHaveCount(0);
  expect((await input.boundingBox())!.width).toBe(initial.width);
});

test("入れ子の横スクロールはRTLへの変更後も方向キーで動く", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto("/iframe.html?id=interactive-controls--collection&viewMode=story");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.getByRole("button", { name: "候補を開く" }).click();
  const dialog = page.getByRole("dialog");
  const bar = dialog.getByRole("scrollbar", { name: "絞り込み（横スクロール）" });
  await expect(bar).toBeVisible();
  // 登場の演出が終わった位置で確かめる。
  await dialog.evaluate((node) => Promise.all(node.getAnimations().map((item) => item.finished)));
  const track = (await bar.boundingBox())!;
  const thumb = (await bar.locator("div").boundingBox())!;
  expect(thumb.y + thumb.height / 2).toBe(track.y + track.height / 2);
  await bar.press("End");
  const end = Number(await bar.getAttribute("aria-valuemax"));
  await expect(bar).toHaveAttribute("aria-valuenow", String(end));
  await dialog.evaluate((n) => {
    n.setAttribute("dir", "rtl");
    // Arkの操作要素も明示的なdirを持つため、内容とスクロール領域を同じ向きにする。
    for (const child of n.querySelectorAll("[dir]")) child.setAttribute("dir", "rtl");
  });
  await bar.press("Home");
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await bar.press("ArrowRight");
  await expect(bar).toHaveAttribute("aria-valuenow", String(Math.min(40, end)));
  await bar.press("ArrowLeft");
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("拡縮した領域でも両軸の端を揃え、RTLでは左下の角を共有する", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--inputs&viewMode=story");
  const input = page.getByRole("textbox", { name: "説明", exact: true });
  await input.evaluate((node) => {
    node.setAttribute("wrap", "off");
    node.parentElement!.style.transform = "translate(12px, 8px) scale(0.9)";
  });
  await input.fill(Array.from({ length: 40 }, () => "長い行".repeat(100)).join("\n"));
  for (const direction of ["ltr", "rtl"]) {
    await input.evaluate((node, dir) => {
      node.setAttribute("dir", dir);
    }, direction);
    const vertical = page.getByRole("scrollbar", { name: "入力内容（縦スクロール）" });
    const horizontal = page.getByRole("scrollbar", { name: "入力内容（横スクロール）" });
    await expect(vertical).toBeVisible();
    await expect(horizontal).toBeVisible();
    await expect
      .poll(async () => {
        const v = (await vertical.boundingBox())!;
        const h = (await horizontal.boundingBox())!;
        return Math.abs(direction === "rtl" ? v.x + v.width - h.x : h.x + h.width - v.x);
      })
      .toBeLessThan(0.1);
    const v = (await vertical.boundingBox())!;
    const h = (await horizontal.boundingBox())!;
    expect(v.y + v.height).toBeCloseTo(h.y, 1);
    const viewport = await input.boundingBox();
    expect(v.y).toBeGreaterThanOrEqual(viewport!.y);
    expect(h.y + h.height).toBeLessThanOrEqual(viewport!.y + viewport!.height);
    for (const [bar, axis] of [
      [vertical, "vertical"],
      [horizontal, "horizontal"],
    ] as const) {
      await bar.press("End");
      await expect
        .poll(async () => {
          const track = (await bar.boundingBox())!;
          const thumb = (await bar.locator("div").boundingBox())!;
          return axis === "vertical"
            ? Math.abs(thumb.y + thumb.height - track.y - track.height)
            : Math.abs(thumb.x + thumb.width - track.x - track.width);
        })
        .toBeLessThan(0.1);
    }
  }
});

test("スクロールバーは待機中に消え、端への移動・ページ送り・キーボード操作で使える", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=controls--inputs&viewMode=story");
  const input = page.getByRole("textbox", { name: "説明", exact: true });
  await input.fill(Array.from({ length: 40 }, (_, i) => `入力の${i + 1}行目`).join("\n"));
  const bar = page.getByRole("scrollbar", { name: "入力内容（縦スクロール）" });
  await input.evaluate((node) => node.scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(0, 0);
  await expect(bar).toHaveCSS("opacity", "0");
  await expect(bar).toHaveCSS("pointer-events", "none");
  const track = (await bar.boundingBox())!;
  const point = { x: track.x + track.width / 2, y: track.y + track.height - 4 };
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="scrollbar"]') !== null,
      point,
    ),
  ).toBe(false);
  await page.mouse.move(point.x, point.y);
  await expect(bar).toHaveCSS("opacity", "1");
  await page.mouse.click(point.x, point.y);
  await expect.poll(() => input.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await page.mouse.move(0, 0);
  await input.focus();
  await expect(bar).toHaveCSS("opacity", "0");
  await bar.press("Home");
  await expect.poll(() => input.evaluate((node) => node.scrollTop)).toBe(0);
  await expect(bar).toHaveCSS("opacity", "1");
  await bar.press("PageDown");
  await expect.poll(() => input.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
});
