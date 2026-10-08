import { expect, test } from "@playwright/test";

test("案内の操作は内容を覆わず、利用可能な幅に応じて次の行へ移る", async ({ page }) => {
  await page.goto("/iframe.html?id=composition--notices&viewMode=story&globals=a11y.manual:!true");
  await expect(page.getByRole("button", { name: "保存する", exact: true })).toBeVisible();
  for (const width of [1000, 560, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const notice of await page.locator(".animic-notice__root").all()) {
      const geometry = await notice.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const content = node.querySelector(".animic-notice__body")!.getBoundingClientRect();
        const action = node.querySelector(".animic-notice__actions")?.getBoundingClientRect();
        const icon = node.querySelector(".animic-notice__icon")!.getBoundingClientRect();
        return {
          contained: !action || (action.right <= box.right && action.bottom <= box.bottom),
          separate: !action || content.right <= action.left || content.bottom <= action.top,
          iconNextToContent: icon.right <= content.left,
          wrapped: !!action && content.bottom <= action.top,
        };
      });
      expect(geometry.contained).toBe(true);
      expect(geometry.separate).toBe(true);
      expect(geometry.iconNextToContent).toBe(true);
      if (width <= 560 && (await notice.locator(".animic-notice__actions").count()))
        expect(geometry.wrapped).toBe(true);
    }
    const buttons = page.getByRole("button", { name: /^(続ける|内容を共有する|一覧に戻る)$/ });
    const rects = await buttons.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().toJSON()),
    );
    if (width <= 560) expect(rects[0].bottom).toBeLessThanOrEqual(rects[1].top);
    else expect(rects[0].top).toBe(rects[1].top);
    const placement = await page
      .getByRole("button", { name: "保存する", exact: true })
      .evaluate((node) => {
        const box = node.getBoundingClientRect();
        const icon = node.querySelector("[data-animic-button-icon]")!.getBoundingClientRect();
        const label = node.querySelector("[data-animic-button-label]")!;
        const range = document.createRange();
        range.selectNodeContents(label);
        const text = range.getBoundingClientRect();
        return { buttonCenter: box.x + box.width / 2, contentCenter: (icon.left + text.right) / 2 };
      });
    expect(placement.contentCenter).toBeCloseTo(placement.buttonCenter, 0);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("表彰台は項目数に関係なく先頭を中央、次点を左右に配置する", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=composition--small-podiums&viewMode=story&globals=a11y.manual:!true",
  );
  await expect(page.locator(".animic-podium__root")).toHaveCount(3);
  for (const width of [1000, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const podium of await page.locator(".animic-podium__root").all()) {
      const boxes = await podium.evaluate((node) => ({
        root: node.getBoundingClientRect().toJSON(),
        items: [...node.children].map((child) => child.getBoundingClientRect().toJSON()),
      }));
      expect(boxes.items[0].x + boxes.items[0].width / 2).toBeCloseTo(
        boxes.root.x + boxes.root.width / 2,
        1,
      );
      if (boxes.items[1]) expect(boxes.items[1].right).toBeLessThanOrEqual(boxes.items[0].left);
      if (boxes.items[2]) expect(boxes.items[0].right).toBeLessThanOrEqual(boxes.items[2].left);
    }
  }
});
