import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAccessible } from "./accessibility";

async function expectRing(target: Locator) {
  await expect(target).toHaveCSS("outline-width", "2px");
  await expect(target).toHaveCSS("outline-style", "solid");
  await expect(target).toHaveCSS("outline-offset", "2px");
}

test("操作の種類に応じたキーボード表示とinvalid borderを維持する", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--focus-states&viewMode=story");
  await expect(page.getByRole("button", { name: "Primary focus" })).toBeVisible();
  const names = [
    "Primary focus",
    "Strong border focus",
    "通常の入力",
    "エラーの入力",
    "Focusを確認",
    "Link focus",
    "選択肢1",
  ];
  for (const name of names) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveAccessibleName(name);
    const target = name === "選択肢1" ? focused.locator("..") : focused;
    if (name.includes("入力")) {
      await expect(target).toHaveCSS("outline-style", "none");
      await expect(target).toHaveCSS("box-shadow", "rgb(11, 27, 43) 0px 0px 0px 1px inset");
    } else if (name === "Link focus") {
      await expect(target).toHaveCSS("outline-style", "none");
      await expect(target).toHaveCSS("text-decoration-thickness", "2px");
    } else {
      await expectRing(target);
      await expect(target).toHaveCSS("outline-color", "rgb(11, 27, 43)");
    }
    if (name === "エラーの入力") {
      await expect(focused).toHaveAttribute("aria-invalid", "true");
      await expect(focused).toHaveCSS("border-color", "rgb(180, 35, 24)");
      await expect(focused).toHaveCSS("border-width", "2px");
    }
    if (name === "Strong border focus")
      await expect(target).toHaveCSS("border-color", "rgb(11, 27, 43)");
    if (name === "通常の入力") await expect(target).toHaveCSS("border-radius", "8px");
    if (name === "Primary focus") await expect(target).toHaveCSS("border-radius", "16px");
    if (name === "Link focus") await expect(target).toHaveCSS("border-radius", "0px");
  }
  await page.keyboard.press("ArrowRight");
  const second = page.getByRole("radio", { name: "選択肢2" });
  await expect(second).toBeFocused();
  await expectRing(second.locator(".."));
  await expect(page.getByRole("radio", { name: "選択肢1" }).locator("..")).toHaveCSS(
    "outline-style",
    "none",
  );
});

test("pointer操作だけではButton・Link・SegmentedControlにringを出さない", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--focus-states&viewMode=story");
  for (const target of [
    page.getByRole("button", { name: "Primary focus" }),
    page.getByRole("link", { name: "Link focus" }),
    page.getByRole("radio", { name: "選択肢1" }).locator(".."),
  ]) {
    await target.click();
    await expect(target).toHaveCSS("outline-style", "none");
  }
  await page.getByLabel("通常の入力").click();
  await expect(page.getByLabel("通常の入力")).toHaveCSS("outline-style", "none");
  await expect(page.getByLabel("通常の入力")).toHaveCSS(
    "box-shadow",
    "rgb(11, 27, 43) 0px 0px 0px 1px inset",
  );
});

test("forced-colorsでもfocus outlineとinvalidの説明を保持する", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/iframe.html?id=controls--focus-states&viewMode=story");
  await expect(page.getByRole("button", { name: "Primary focus" })).toBeVisible();
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    const radio = (await focused.getAttribute("type")) === "radio";
    if (index === 2 || index === 3) {
      await expect(focused).toHaveCSS("outline-style", "solid");
      await expect(focused).toHaveCSS("outline-offset", "-2px");
    } else if (index === 5) {
      await expect(focused).toHaveCSS("text-decoration-line", "underline");
      await expect(focused).toHaveCSS("text-decoration-thickness", "2px");
    } else await expectRing(radio ? focused.locator("..") : focused);
  }
  const error = page.getByLabel("エラーの入力");
  await expect(error).toHaveAttribute("aria-invalid", "true");
  await expect(error).toHaveCSS("border-width", "2px");
  await expect(page.getByText("入力内容を確認してください。")).toBeVisible();
});

for (const [name, tabs] of [
  ["normal", 3],
  ["invalid", 4],
  ["segmented", 7],
] as const) {
  test(`focus ${name}: visual regression`, async ({ page }) => {
    test.skip(process.platform !== "linux", "画像比較の基準環境はLinux。CIで必ず実行する。");
    await page.goto("/iframe.html?id=controls--focus-states&viewMode=story");
    await page.getByRole("heading").waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (let index = 0; index < tabs; index++) await page.keyboard.press("Tab");
    await expect(page).toHaveScreenshot(`focus-${name}.png`, { fullPage: true });
  });
}

for (const fontSize of [16, 32]) {
  test(`Gridは利用可能幅で縮退しDOM順を維持する (${fontSize}px)`, async ({ page }) => {
    await page.setViewportSize({ width: 2400, height: 1000 });
    for (const [story, requested] of [
      ["one-column", 1],
      ["two-columns", 2],
      ["three-columns", 3],
      ["four-columns", 4],
    ] as const) {
      await page.goto(`/iframe.html?id=layout-boundaries--${story}&viewMode=story`);
      const layout = page.locator("[data-animic-grid-layout]");
      await layout.waitFor();
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}px`;
      }, fontSize);
      for (const width of [
        30 * fontSize - 1,
        30 * fontSize,
        30 * fontSize + 1,
        54 * fontSize - 1,
        54 * fontSize,
        54 * fontSize + 1,
      ]) {
        await layout.evaluate((node, value) => {
          if (node.parentElement) node.parentElement.style.width = `${value}px`;
        }, width);
        const columns =
          width < 30 * fontSize ? 1 : width < 54 * fontSize ? Math.min(2, requested) : requested;
        await expect
          .poll(() =>
            layout.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length),
          )
          .toBe(columns);
        const order = await layout.getByRole("heading").allTextContents();
        expect(order).toEqual(
          Array.from({ length: requested }, (_, i) => `作品${i + 1}を見比べる`),
        );
      }
    }
  });
  test(`非対称Splitは54em前後で切り替え、gapとDOM順を維持する (${fontSize}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2400, height: 1000 });
    for (const story of ["main-and-aside", "aside-and-main"]) {
      await page.goto(`/iframe.html?id=layout-boundaries--${story}&viewMode=story`);
      const layout = page.locator("[data-animic-split-layout]");
      await layout.waitFor();
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}px`;
      }, fontSize);
      for (const width of [54 * fontSize - 1, 54 * fontSize, 54 * fontSize + 1]) {
        await layout.evaluate((node, value) => {
          if (node.parentElement) node.parentElement.style.width = `${value}px`;
        }, width);
        await expect
          .poll(() =>
            layout.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length),
          )
          .toBe(width < 54 * fontSize ? 1 : 2);
        await expect(layout).toHaveCSS("gap", `${fontSize * 1.5}px`);
        const sizes = await layout.evaluate((node) =>
          getComputedStyle(node).gridTemplateColumns.split(" ").map(parseFloat),
        );
        if (sizes.length === 2)
          expect(sizes[0] / sizes[1]).toBeCloseTo(story === "main-and-aside" ? 2 : 0.5, 2);
        expect(await layout.getByRole("heading").allTextContents()).toEqual(
          story === "main-and-aside"
            ? ["主領域を見比べる", "補助領域を見比べる"]
            : ["補助領域を見比べる", "主領域を見比べる"],
        );
      }
    }
  });
  test(`equal Splitは30em前後で切り替え、gapとDOM順を維持する (${fontSize}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2400, height: 1000 });
    await page.goto("/iframe.html?id=layout-boundaries--equal-split&viewMode=story");
    const layout = page.locator("[data-animic-split-layout]");
    await layout.waitFor();
    await page.evaluate((size) => {
      document.documentElement.style.fontSize = `${size}px`;
    }, fontSize);
    for (const width of [30 * fontSize - 1, 30 * fontSize, 30 * fontSize + 1]) {
      await layout.evaluate((node, value) => {
        if (node.parentElement) node.parentElement.style.width = `${value}px`;
      }, width);
      await expect
        .poll(() =>
          layout.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length),
        )
        .toBe(width < 30 * fontSize ? 1 : 2);
      await expect(layout).toHaveCSS("gap", `${fontSize * 1.5}px`);
      expect(await layout.getByRole("heading").allTextContents()).toEqual([
        "作品1を見比べる",
        "作品2を見比べる",
      ]);
    }
  });
  test(`Dialogのpresentationは30em前後で切り替え、Actionのcompositionを維持する (${fontSize}px)`, async ({
    page,
  }) => {
    for (const story of ["open-dialog", "centered-dialog"]) {
      await page.goto(`/iframe.html?id=overlays--${story}&viewMode=story`);
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}px`;
      }, fontSize);
      for (const width of [30 * fontSize - 1, 30 * fontSize, 30 * fontSize + 1]) {
        await page.setViewportSize({ width, height: 1000 });
        const bottom = story === "open-dialog" && width < 30 * fontSize;
        await expect(dialog).toHaveCSS(
          "border-bottom-left-radius",
          bottom ? "0px" : `${fontSize * 1.5}px`,
        );
        const rect = await dialog.boundingBox();
        expect(rect).not.toBeNull();
        if (rect && bottom) {
          expect(rect.x).toBe(0);
          expect(rect.width).toBe(width);
          expect(rect.y + rect.height).toBeCloseTo(1000, 0);
        }
        const actions = dialog.getByRole("button", { name: "確認して保存する" }).locator("..");
        await expect(actions).toHaveCSS("display", "flex");
        await expect(actions).toHaveCSS("flex-wrap", "wrap");
        await expect(actions).toHaveCSS("gap", `${fontSize / 2}px`);
      }
    }
  });
}

for (const fontSize of [16, 32]) {
  test(`Grid・Splitの長いlabel・error・8文字codeを通常改行で表示する (${fontSize}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2400, height: 1100 });
    for (const story of [
      "one-column",
      "two-columns",
      "three-columns",
      "four-columns",
      "equal-split",
      "main-and-aside",
      "aside-and-main",
    ]) {
      await page.goto(`/iframe.html?id=layout-boundaries--${story}&viewMode=story`);
      const layout = page.locator("[data-animic-grid-layout], [data-animic-split-layout]");
      await layout.waitFor();
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}px`;
      }, fontSize);
      await page.evaluate(() => document.fonts.ready);
      // 狭幅と、各Container Queryの切り替え直前・直後を同じ内容で検証する。
      for (const width of [
        320,
        30 * fontSize - 1,
        30 * fontSize,
        54 * fontSize - 1,
        54 * fontSize,
      ]) {
        await layout.evaluate((node, value) => {
          if (node.parentElement) node.parentElement.style.width = `${value}px`;
        }, width);
        const overflow = await layout.evaluate((node) =>
          [
            ...node.querySelectorAll<HTMLElement>(
              '[data-testid="boundary-code"], [data-testid="boundary-card"], [data-scope="field"]',
            ),
          ]
            .filter(
              (element) =>
                element.tagName !== "INPUT" &&
                element.tagName !== "TEXTAREA" &&
                element.scrollWidth > element.clientWidth + 1,
            )
            .map((element) => ({
              text: element.textContent,
              width: element.clientWidth,
              scroll: element.scrollWidth,
            })),
        );
        expect.soft(overflow, `${story}: available=${width}px / font=${fontSize}px`).toEqual([]);
        for (const code of await layout.getByTestId("boundary-code").all()) {
          await expect(code).toHaveCSS("overflow-wrap", "normal");
          await expect(code).toHaveCSS("font-size", `${fontSize}px`);
        }
      }
    }
  });
}

test("Gridの入れ子は自身のcontainerを参照する", async ({ page }) => {
  await page.setViewportSize({ width: 1152, height: 1000 });
  await page.goto("/iframe.html?id=layout-boundaries--nested-grid&viewMode=story");
  const outer = page.getByTestId("outer-grid").locator(":scope > [data-animic-grid-layout]");
  const inner = page.getByTestId("inner-grid").locator(":scope > [data-animic-grid-layout]");
  await expect
    .poll(() => outer.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length))
    .toBe(2);
  await expect
    .poll(() => inner.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length))
    .toBe(2);
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect
    .poll(() => outer.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length))
    .toBe(2);
  await expect
    .poll(() => inner.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length))
    .toBe(1);
});

test("320pxのviewport・文字200%でもGridとSplitの8文字codeが内容領域に収まる", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const story of [
    "one-column",
    "two-columns",
    "three-columns",
    "four-columns",
    "equal-split",
    "main-and-aside",
    "aside-and-main",
  ]) {
    await page.goto(`/iframe.html?id=layout-boundaries--${story}&viewMode=story`);
    await page.getByTestId("boundary-code").first().waitFor();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await page.evaluate(async () => {
      await document.fonts.load('700 32px "JetBrains Mono"', "ABCD2345");
      await document.fonts.ready;
    });
    for (const code of await page.getByTestId("boundary-code").all()) {
      await expect(code).toHaveText("ABCD2345");
      await expect(code).toHaveCSS("font-size", "32px");
      await expect(code).toHaveCSS("font-family", /JetBrains Mono/);
      await expect(code).toHaveCSS("font-weight", "700");
      await expect(code).toHaveCSS("line-height", "48px");
      await expect(code).toHaveCSS("letter-spacing", "3.84px");
      await expect(code).toHaveCSS("overflow-wrap", "normal");
      await expect(code).toHaveCSS("white-space", "normal");
    }
    const codes = await page.getByTestId("boundary-code").evaluateAll((nodes) =>
      nodes.map((node) => {
        const surface = node.closest('[data-testid="boundary-card"]');
        if (!surface) throw new Error("codeを包むSurfaceがありません");
        const surfaceStyle = getComputedStyle(surface);
        const surfaceRect = surface.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        const textRect = range.getBoundingClientRect();
        return {
          contentWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          textLeft: textRect.left,
          textRight: textRect.right,
          surfaceContentLeft:
            surfaceRect.left +
            parseFloat(surfaceStyle.borderLeftWidth) +
            parseFloat(surfaceStyle.paddingLeft),
          surfaceContentRight:
            surfaceRect.right -
            parseFloat(surfaceStyle.borderRightWidth) -
            parseFloat(surfaceStyle.paddingRight),
        };
      }),
    );
    for (const code of codes) {
      const context = `${story}: ${JSON.stringify(code)}`;
      expect.soft(code.scrollWidth, context).toBeLessThanOrEqual(code.contentWidth + 1);
      expect.soft(code.textLeft, context).toBeGreaterThanOrEqual(code.surfaceContentLeft);
      expect.soft(code.textRight, context).toBeLessThanOrEqual(code.surfaceContentRight);
    }
    const documentWidth = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    expect.soft(documentWidth.scroll, story).toBeLessThanOrEqual(documentWidth.viewport);
  }
});

test("320px・文字200%のDialogは内部scrollで情報と操作を維持する", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/iframe.html?id=overlays--open-dialog&viewMode=story");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(dialog.getByRole("heading")).toHaveCSS("font-size", "48px");
  await expect(dialog).toHaveCSS("overflow-y", "auto");
  expect(await dialog.evaluate((n) => n.scrollWidth <= n.clientWidth)).toBe(true);
  expect(await dialog.evaluate((n) => n.scrollHeight > n.clientHeight)).toBe(true);
  await dialog.getByRole("button", { name: "確認して保存する" }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole("button", { name: "確認して保存する" })).toBeInViewport();
  await expectAccessible(
    new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]),
  );
});
