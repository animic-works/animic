import { expect, test } from "@playwright/test";
import * as v from "valibot";
import { textStyles } from "../../../packages/design-system/src/styles/text";
import {
  fonts,
  fontWeights,
} from "../../../packages/design-system/src/tokens/primitive/typography";

test("単一CSS入口から必要なFontsourceとPanda CSSが読み込まれる", async ({ page }) => {
  const failedFonts: string[] = [];
  page.on("response", (response) => {
    if (/\.(woff2?|css)(\?|$)/.test(response.url()) && !response.ok())
      failedFonts.push(response.url());
  });
  await page.goto("/iframe.html?id=foundations--typography&viewMode=story");
  await expect(page.getByRole("heading").first()).toBeVisible();
  const styles = v.parse(
    v.record(
      v.string(),
      v.object({
        value: v.object({
          fontFamily: v.string(),
          fontWeight: v.string(),
          fontStyle: v.optional(v.string(), "normal"),
        }),
      }),
    ),
    textStyles,
  );
  const families = new Map(Object.entries(fonts));
  const weights = new Map(Object.entries(fontWeights));
  for (const { value } of Object.values(styles)) {
    const family = families.get(value.fontFamily)?.value.split(",")[0];
    const weight = String(weights.get(value.fontWeight)?.value);
    if (!family) throw new Error(`Unknown family: ${value.fontFamily}`);
    const faces = await page.evaluate(
      async ({ familyName, fontWeight, fontStyle }) => {
        const loaded = await document.fonts.load(
          `${fontStyle} ${fontWeight} 16px ${familyName}`,
          "Animic あにみく",
        );
        return loaded.map((font) => ({
          family: font.family,
          weight: font.weight,
          style: font.style,
          status: font.status,
        }));
      },
      { familyName: family, fontWeight: weight, fontStyle: value.fontStyle },
    );
    expect(faces.length).toBeGreaterThan(0);
    expect(
      faces.every(
        (face) =>
          face.weight === weight && face.style === value.fontStyle && face.status === "loaded",
      ),
    ).toBe(true);
  }
  expect(failedFonts).toEqual([]);
  await expect(page.locator("[data-animic-root]")).toHaveCSS(
    "background-color",
    "rgb(245, 246, 248)",
  );
});

test("rootと子孫・疑似要素だけに基礎設定を適用する", async ({ page }) => {
  await page.goto("/iframe.html?id=foundations--typography&viewMode=story");
  const root = page.locator("[data-animic-root]");
  await expect(root).toHaveCSS("font-synthesis", "none");
  const sizing = await root.evaluate((node) =>
    [node, ...node.querySelectorAll("*")].flatMap((element) =>
      [null, "::before", "::after"].map((pseudo) => getComputedStyle(element, pseudo).boxSizing),
    ),
  );
  expect(new Set(sizing)).toEqual(new Set(["border-box"]));
  await expect(page.locator("body")).toHaveCSS("font-synthesis", "weight style small-caps");
  const outside = await page.evaluate(() => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    return {
      box: getComputedStyle(element).boxSizing,
      pseudo: getComputedStyle(element, "::before").boxSizing,
    };
  });
  expect(outside).toEqual({ box: "content-box", pseudo: "content-box" });
});

test("PortalのDialog・Toastへfont-synthesisとbox sizingを適用する", async ({ page }) => {
  await page.goto("/iframe.html?id=overlays--open-dialog&viewMode=story");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("font-synthesis", "none");
  await expect(dialog.getByText("作品を比較し", { exact: false })).toHaveCSS(
    "font-synthesis",
    "none",
  );
  expect(await dialog.evaluate((node) => node.closest("[data-animic-root]"))).toBeNull();
  await dialog.getByRole("button", { name: "通知を表示" }).click();
  const toast = page.locator('[data-scope="toast"][data-part="root"]');
  await expect(toast).toHaveCSS("font-synthesis", "none");
  await expect(toast.locator('[data-part="description"]')).toHaveCSS("font-synthesis", "none");
  for (const target of [dialog, toast]) {
    expect(await target.evaluate((node) => getComputedStyle(node, "::before").boxSizing)).toBe(
      "border-box",
    );
  }
});

test("Toastのsafe-areaはmount後のLTR・RTL変更にも追従する", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 40, left: 60, right: 25, bottom: 0 },
  });
  await page.goto("/iframe.html?id=overlays--dialog-and-toast&viewMode=story");
  await page.getByRole("button", { name: "通知を表示" }).click();
  const viewport = page.locator('[data-scope="toast"][data-part="group"]');
  const notice = page.locator('[data-scope="toast"][data-part="root"]');
  await expect(viewport).toHaveCSS("z-index", "20");
  expect(await viewport.evaluate((node) => node.style.zIndex)).toBe("");
  for (const direction of ["ltr", "rtl", "ltr"]) {
    await page.evaluate((dir) => {
      document.documentElement.dir = dir;
    }, direction);
    const inset = direction === "rtl" ? 60 : 25;
    await expect(viewport).toHaveCSS("inset-block-start", "40px");
    await expect(viewport).toHaveCSS("inset-inline-end", `${inset}px`);
    const rect = await notice.boundingBox();
    expect(rect).not.toBeNull();
    if (rect) {
      expect(rect.y).toBeCloseTo(40, 0);
      expect(direction === "rtl" ? rect.x : 1000 - rect.x - rect.width).toBeCloseTo(inset, 0);
    }
  }
  await session.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 3, left: 5, right: 7, bottom: 0 },
  });
  await expect(viewport).toHaveCSS("inset-block-start", "16px");
  await expect(viewport).toHaveCSS("inset-inline-end", "16px");
  await page.getByRole("button", { name: "通知を閉じる" }).focus();
  await page.keyboard.press("Enter");
  await expect(notice).toHaveCount(0);
});
