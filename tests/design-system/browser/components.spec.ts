import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAccessible } from "./accessibility";
const stories = [
  "foundations--typography",
  "foundations--surfaces",
  "foundations--layouts",
  "controls--buttons",
  "controls--auxiliary-buttons",
  "overlays--fullscreen-dialog",
  "controls--inputs",
  "controls--feedback",
  "overlays--dialog-and-toast",
  "overlays--toasts",
  "overlays--without-description",
  "overlays--open-dialog",
];

test("Dialogのサイズ・配置・色は独立し、見出しを隠しても検索を操作できる", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/iframe.html?id=overlays--compact-centered-dialog&viewMode=story");
    const dialog = page.getByRole("dialog", { name: "変更を確認" });
    await expect(dialog).toBeVisible();
    const bounds = (await dialog.boundingBox())!;
    expect(bounds.width).toBeLessThanOrEqual(400);
    expect(Math.abs(bounds.x + bounds.width / 2 - width / 2)).toBeLessThan(1);
    expect(Math.abs(bounds.y + bounds.height / 2 - 450)).toBeLessThan(1);
    const title = page.getByRole("heading", { name: "変更を確認" });
    await expect(title).toHaveCSS("text-align", "center");
    await expect(title).toHaveCSS("padding-left", "0px");
    const confirm = dialog.getByRole("button", { name: "保存する" });
    await expect(confirm).toHaveCSS("box-shadow", "none");
    await confirm.hover();
    await expect(confirm).toHaveCSS("box-shadow", "none");
    await page.mouse.down();
    await expect(confirm).toHaveCSS("box-shadow", "none");
    await page.mouse.up();
  }
  await page.goto("/iframe.html?id=overlays--immersive-compact-dialog&viewMode=story");
  await expect(page.getByText("しばらくお待ちください。", { exact: true })).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await page.goto("/iframe.html?id=overlays--hidden-title-with-actions&viewMode=story");
  await expect(page.getByRole("dialog", { name: "候補を選択" })).toBeVisible();
  const search = page.getByRole("textbox", { name: "候補を検索" });
  await search.fill("画像");
  await expect(search).toHaveValue("画像");
});
for (const story of stories) {
  test(`${story}: 表示・アクセシビリティ`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // axeはPlaywright側で実行し、Storybook addonとの同時実行を避ける。
    await page.goto(`/iframe.html?id=${story}&viewMode=story&globals=a11y.manual:!true`);
    await expect(page.locator("#storybook-root main")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (story === "foundations--surfaces")
      await expect(page.getByRole("separator")).toHaveCSS("height", "1px");
    const openDialog = [
      "overlays--open-dialog",
      "overlays--without-description",
      "overlays--fullscreen-dialog",
    ].includes(story);
    if (openDialog) await expect(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(
      new AxeBuilder({ page })
        .include(openDialog ? '[role="dialog"]' : "main")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]),
    );
    expect(errors).toEqual([]);
  });
}
test("Fieldのlabel・description・errorと無効状態", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--inputs&viewMode=story");
  const input = page.getByLabel("表示名（必須）");
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute("required", "");
  await expect(input).toHaveAccessibleDescription("ほかの参加者に表示されます。");
  // 入力欄の枠は淡い色で、フォーカス中だけ濃くする。
  await expect(input).toHaveCSS("border-color", "rgb(223, 226, 231)");
  await input.focus();
  await expect(input).toHaveCSS("border-color", "rgb(11, 27, 43)");
  const invalid = page.getByLabel("招待コード");
  await expect(invalid).toHaveAttribute("aria-invalid", "true");
  const errorId = await invalid.getAttribute("aria-errormessage");
  expect(errorId).toBeTruthy();
  expect(
    await page.evaluate((id) => document.getElementById(id ?? "")?.textContent, errorId),
  ).toContain("入力が長すぎます");
  await expect(page.getByLabel("無効な入力")).toBeDisabled();
  await expect(page.getByLabel("参照専用")).toHaveAttribute("readonly", "");
  await input.fill("あにみく");
  await expect(input).toHaveValue("あにみく");
});
test("SegmentedControlの矢印操作とdisabledのスキップ", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--inputs&viewMode=story");
  const first = page.getByRole("radio", { name: "一覧を表示" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "詳細と説明を表示" })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(first).toBeChecked();
});
test("Dialogのfocus trap・Escape・復帰・スクロール制限", async ({ page }) => {
  await page.goto("/iframe.html?id=overlays--dialog-and-toast&viewMode=story");
  const trigger = page.getByRole("button", { name: "ダイアログを開く" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName("入力した内容を確認して保存します");
  await expect(page.locator('[data-scope="dialog"][data-part="backdrop"]')).toHaveCSS(
    "z-index",
    "10",
  );
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
test("Toastは画面下の中央に出し、次の通知で置き換えて時間で閉じる", async ({ page }) => {
  await page.goto("/iframe.html?id=overlays--toasts&viewMode=story&globals=a11y.manual:!true");
  const notices = page.locator('[data-scope="toast"][data-part="root"]');
  const visible = page.locator('[data-scope="toast"][data-part="root"][data-state="open"]');
  await page.getByRole("button", { name: "通知を表示", exact: true }).click();
  await page.getByRole("button", { name: "短い通知を表示" }).click();
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText("保存しました");
  const region = page.locator('[data-scope="toast"][data-part="group"]');
  await expect(region).toHaveCSS("z-index", "20");
  await expectAccessible(
    new AxeBuilder({ page })
      .include('[data-scope="toast"][data-part="group"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"]),
  );
  const box = await visible.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport).toBeTruthy();
  if (box && viewport) {
    expect(box.x + box.width / 2).toBeCloseTo(viewport.width / 2, 0);
    expect(box.y + box.height).toBeGreaterThan(viewport.height / 2);
  }
  await expect(notices).toHaveCount(0, { timeout: 5000 });
});
test("Primary state・focus・reduced motion", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--buttons&viewMode=story");
  const button = page.getByRole("button", { name: "Primary", exact: true });
  await expect(button).toHaveCSS("background-color", "rgb(255, 45, 135)");
  await button.hover();
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
  await expect(button).toHaveCSS("background-color", "rgb(255, 45, 135)");
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 1)");
  await expect(button).toHaveCSS("background-color", "rgb(255, 45, 135)");
  await page.mouse.up();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("outline-color", "rgb(11, 27, 43)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(button).toHaveCSS("transition-duration", "0s");
  for (const target of [button, page.getByRole("button", { name: "閉じる", exact: true })]) {
    await target.hover();
    await page.mouse.down();
    expect(await target.evaluate((node) => node.matches(":active"))).toBe(true);
    await expect(target).toHaveCSS("transform", "none");
    await page.mouse.up();
  }
  await page.goto("/iframe.html?id=controls--feedback&viewMode=story");
  await expect(page.getByRole("status").locator("[aria-hidden=true]")).toHaveCSS(
    "animation-name",
    "none",
  );
});
test("長い入力・文字拡大でもControlを縮めない", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/iframe.html?id=controls--inputs&viewMode=story");
  await expect(page.getByLabel("表示名（必須）")).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(page.getByLabel("表示名（必須）")).toHaveCSS("font-size", "32px");
  await page.getByLabel("表示名（必須）").focus();
  await expect(page.getByLabel("表示名（必須）")).toHaveCSS("outline-style", "none");
  await expect(page.getByLabel("表示名（必須）")).toHaveCSS(
    "box-shadow",
    "rgb(11, 27, 43) 0px 0px 0px 1px inset",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
for (const story of [
  "foundations--typography",
  "foundations--surfaces",
  "controls--inputs",
  "overlays--open-dialog",
]) {
  test(`${story}: visual regression`, async ({ page }) => {
    test.skip(process.platform !== "linux", "画像比較の基準環境はLinux。CIで必ず実行する。");
    await page.goto(`/iframe.html?id=${story}&viewMode=story`);
    await expect(page.locator("#storybook-root main")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (story === "overlays--open-dialog") await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveScreenshot(`${story}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
}

for (const name of ["利用できません", "削除できません"]) {
  test(`${name}: disabledの色とhover・pressed抑制`, async ({ page }) => {
    await page.goto("/iframe.html?id=controls--buttons&viewMode=story");
    const button = page.getByRole("button", { name, exact: true });
    await expect(button).toBeDisabled();
    for (const state of ["default", "hover", "pressed"]) {
      if (state === "hover") await button.hover();
      if (state === "pressed") {
        await page.mouse.down();
        expect(await button.evaluate((node) => node.matches(":active"))).toBe(true);
      }
      // トランジションの開始直後だけを見て、ホバー・押下時の誤った遷移先を見逃さない。
      await page.waitForTimeout(200);
      await expect(button).toHaveCSS(
        "background-color",
        name === "削除できません" ? "rgb(230, 232, 236)" : "color(srgb 1 0.711765 0.835294)",
      );
      await expect(button).toHaveCSS(
        "color",
        name === "削除できません" ? "rgb(154, 163, 174)" : "rgb(255, 255, 255)",
      );
      await expect(button).toHaveCSS(
        "border-color",
        name === "削除できません" ? "rgb(223, 226, 231)" : "rgba(0, 0, 0, 0)",
      );
      await expect(button).toHaveCSS("box-shadow", "none");
      await expect(button).toHaveCSS("transform", "none");
    }
    await page.mouse.up();
  });
}

test("Visualのraw geometryと局所Keyframesがブラウザまで成立する", async ({ page }) => {
  await page.goto("/iframe.html?id=feature-visual--local-motion&viewMode=story");
  const artwork = page.getByTestId("visual-artwork");
  await expect(artwork).toHaveCSS("top", "-5px");
  await expect(artwork).toHaveCSS("width", "37px");
  await expect(artwork).toHaveCSS("height", "19px");
  await expect(page.getByTestId("visual-direct")).toHaveCSS("top", "-5px");
  const animation = await artwork.evaluate((node) => {
    const active = node.getAnimations().find((item) => item instanceof CSSAnimation);
    const frames = active?.effect instanceof KeyframeEffect ? active.effect.getKeyframes() : [];
    return {
      name: active instanceof CSSAnimation ? active.animationName : null,
      opacity: frames.map((frame) => frame.opacity),
    };
  });
  expect(animation.name).toBeTruthy();
  expect(animation.opacity.map(Number)).toEqual([0, 1]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(artwork).toHaveCSS("animation-name", "none");
  expect(await artwork.evaluate((node) => node.getAnimations().length)).toBe(0);
});

test("アートワークの画面条件が境界幅と縦横に応じて切り替わる", async ({ page }) => {
  await page.goto("/iframe.html?id=feature-visual--responsive-artwork&viewMode=story");
  const artwork = page.getByTestId("responsive-artwork");
  for (const [width, height, expectedWidth, expectedTop, angle] of [
    [560, 800, 110, 20, -9],
    [561, 800, 160, 40, -9],
    [561, 500, 200, 80, -17],
    [1100, 1200, 160, 40, -9],
    [1101, 1200, 200, 80, -17],
    [1440, 900, 200, 80, -17],
    [390, 844, 110, 20, -9],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(artwork).toHaveCSS("width", `${expectedWidth}px`);
    await expect(artwork).toHaveCSS("top", `${expectedTop}px`);
    const rotation = await artwork.evaluate((node) => {
      const matrix = new DOMMatrix(getComputedStyle(node).transform);
      return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    });
    expect(rotation).toBeCloseTo(angle, 2);
  }
});

test("Fieldがid・ラベル・説明・エラーの関連付けを管理する", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=controls--field-associations&viewMode=story&globals=a11y.manual:!true",
  );
  for (const [id, label, description] of [
    ["email", "メール", "連絡先を入力します。"],
    ["message", "メッセージ", "内容を入力します。"],
  ]) {
    const control = page.getByRole("textbox", { name: label, exact: true });
    await expect(control).toHaveAttribute("id", id);
    await expect(control).toHaveAccessibleDescription(description);
    await expect(control).toHaveAttribute("aria-invalid", "true");
    const errorId = await control.getAttribute("aria-errormessage");
    expect(errorId).toBeTruthy();
    await expect(page.locator(`[id="${errorId}"]`)).toContainText("確認してください。");
    await page.locator(`label[for="${id}"]`).click();
    await expect(control).toBeFocused();
  }
  for (const [id, label] of [
    ["standalone-input", "単独のInput"],
    ["standalone-textarea", "単独のTextarea"],
  ]) {
    const control = page.getByRole("textbox", { name: label, exact: true });
    await expect(control).toHaveAttribute("id", id);
    await expect(control).toHaveAccessibleDescription("別の説明");
  }
  await expectAccessible(
    new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]),
  );
});

for (const story of ["overlays--expanded-header-dialog", "overlays--hidden-title-with-actions"]) {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 900, height: 900 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    test(`Dialogの検索欄と閉じる操作は重ならない: ${story} ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/iframe.html?id=${story}&viewMode=story`);
      const search = page.getByRole("textbox", { name: "候補を検索" });
      const close = page.getByRole("button", { name: "閉じる", exact: true });
      await expect(search).toBeVisible();
      await expect(close).toBeVisible();
      const inputBounds = (await search.boundingBox())!;
      const closeBounds = (await close.boundingBox())!;
      const overlaps =
        inputBounds.x < closeBounds.x + closeBounds.width &&
        inputBounds.x + inputBounds.width > closeBounds.x &&
        inputBounds.y < closeBounds.y + closeBounds.height &&
        inputBounds.y + inputBounds.height > closeBounds.y;
      expect(overlaps).toBe(false);
      await search.fill("候補");
      await expect(search).toHaveValue("候補");
    });
  }
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 667, height: 320 },
]) {
  test(`Dialogの見出し前の画像・操作・補足が順序と中央配置を維持する ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/iframe.html?id=overlays--header-media-dialog&viewMode=story");
    const dialog = page.getByRole("dialog", { name: "ログインしてはじめよう" });
    const logo = dialog.getByRole("img", { name: "サービスのロゴ" });
    const title = dialog.getByRole("heading", { name: "ログインしてはじめよう" });
    await expect(dialog).toBeVisible();
    const logoBox = await logo.boundingBox();
    const titleBox = await title.boundingBox();
    const dialogBox = await dialog.boundingBox();
    if (!logoBox || !titleBox || !dialogBox) throw new Error("Dialogの配置を取得できません。");
    const closeBox = await dialog
      .getByRole("button", { name: "閉じる", exact: true })
      .boundingBox();
    if (!closeBox) throw new Error("閉じる操作の配置を取得できません。");
    expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(logoBox.y);
    expect(logoBox.y + logoBox.height).toBeLessThanOrEqual(titleBox.y);
    expect(
      Math.abs(titleBox.x + titleBox.width / 2 - (dialogBox.x + dialogBox.width / 2)),
    ).toBeLessThan(1);
    await expect(title).toHaveCSS("padding-left", "0px");
    expect(
      await title.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects().length;
      }),
    ).toBe(1);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    const action = dialog.getByRole("button", { name: "Discordでログイン" });
    await action.focus();
    await expect(action).toBeInViewport();
    await dialog
      .getByText("利用規約とプライバシーポリシーを確認して続行します。")
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByText("利用規約とプライバシーポリシーを確認して続行します。"),
    ).toBeInViewport();
    await expect(dialog).toHaveAttribute("aria-describedby");
  });
}

test("処理中の共通ボタンは外観とフォーカスを保ち再実行を止める", async ({ page }) => {
  await page.goto("/iframe.html?id=controls--pending-buttons&viewMode=story");
  let count = 0;
  for (const name of ["保存", "追加", "認証"]) {
    const action = page.getByRole("button", { name, exact: true });
    await action.hover();
    await action.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    const colors = await action.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color, style.boxShadow];
    });
    await action.click();
    count++;
    await expect(action).toBeFocused();
    await expect(action).toHaveAttribute("aria-busy", "true");
    await expect(action).toHaveAttribute("aria-disabled", "true");
    await expect(action).not.toHaveAttribute("disabled");
    expect(
      await action.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.color, style.boxShadow];
      }),
    ).toEqual(colors);
    await action.click({ force: true });
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(page.getByText(`実行回数: ${count}`, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "条件不足" })).toBeDisabled();
    await page.getByRole("button", { name: "待機を解除" }).click();
    await expect(action).not.toHaveAttribute("aria-busy", "true");
  }
});
