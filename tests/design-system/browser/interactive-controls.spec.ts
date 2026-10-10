import { test, expect } from "@playwright/test";

test("候補を閉じた後も入力で再表示し、Shift+Tabでは確定せず前の操作へ戻る", async ({ page }) => {
  await page.goto("/iframe.html?id=interactive-controls--editor&viewMode=story");
  const input = page.getByRole("combobox", { name: "語句" });
  await input.fill("blue");
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await expect(input).toBeFocused();
  await input.press("e");
  await input.press("Backspace");
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await input.press("Shift+Tab");
  await expect(input).not.toBeFocused();
  await expect(input).toHaveValue("blue");
  await expect(page.getByRole("button", { name: /書き直す/ })).toHaveCount(0);
  await input.focus();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(page.getByRole("button", { name: /書き直す/ })).toHaveCount(1);
});

test("候補をキーボードで選び、トークンの重みを変更して編集へ戻れる", async ({ page }) => {
  await page.goto("/iframe.html?id=interactive-controls--editor&viewMode=story");
  const input = page.getByRole("combobox", { name: "語句" });
  await input.fill("blue");
  await input.press("ArrowDown");
  await input.press("Tab");
  await expect(input).toHaveValue("");
  await expect(page.getByRole("button", { name: /blue eyes.*書き直す/ })).toBeVisible();
  await page.getByRole("button", { name: /blue eyes.*強くする/ }).click();
  await expect(page.getByText("1.1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /blue eyes.*書き直す/ }).click();
  await expect(input).toHaveValue("blue eyes");
  await page.getByRole("checkbox", { name: "確認を省略" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("checkbox", { name: "確認を省略" })).toBeChecked();
});

for (const width of [390, 1200])
  test(`候補一覧 ${width}px: 決定操作・カテゴリ・検索を使い、フォーカスを戻す`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/iframe.html?id=interactive-controls--collection&viewMode=story");
    const trigger = page.getByRole("button", { name: "候補を開く" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "候補を選ぶ" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("searchbox").fill("空");
    await dialog.getByRole("button", { name: "空", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "空", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const done = dialog.getByRole("button", { name: "決定（1件）" });
    await expect(done).toBeInViewport();
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

test("アバター操作はフォーカスでき、選んだファイルを呼び出し元へ渡す", async ({ page }) => {
  await page.goto("/iframe.html?id=interactive-controls--identity&viewMode=story");
  const trigger = page.getByRole("button", { name: "アイコンを変更" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "アイコン", exact: true })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "icon.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
  });
  await expect(page.getByText("icon.svg", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("img", { name: "プロフィールのURL" })).toBeVisible();
});

test("処理の進捗と現在の手順を読み取れ、完了時に状態が揃う", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/iframe.html?id=interactive-controls--processing&viewMode=story");
  const progress = page.getByRole("progressbar", { name: "処理全体" });
  await expect(progress).toHaveAttribute("aria-valuenow", "40");
  await expect(page.locator('[aria-current="step"]')).toHaveText("変換50%");
  await page.getByRole("button", { name: "完了する" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "100");
  await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("複数ファイルをまとめて通知し、同じ選択をやり直せる", async ({ page }) => {
  await page.goto("/iframe.html?id=interactive-controls--files&viewMode=story");
  const trigger = page.getByRole("button", { name: "画像をまとめて選ぶ" });
  await trigger.focus();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  const chooser = await chooserPromise;
  expect(chooser.isMultiple()).toBe(true);
  const files = ["first.png", "second.png"].map((name) => ({
    name,
    mimeType: "image/png",
    buffer: Buffer.from("file-selection"),
  }));
  await chooser.setFiles(files);
  await expect(page.getByRole("status")).toContainText("first.png");
  await expect(page.getByRole("status")).toContainText("second.png");
  await expect(page.getByRole("status")).toContainText("1回選択");
  await page.locator('input[type="file"]').setInputFiles(files);
  await expect(page.getByRole("status")).toContainText("2回選択");
});

test("修飾Enterは候補確定せず送信し、明示した場合だけblurで確定する", async ({ page }) => {
  await page.goto("/iframe.html?id=interactive-controls--editor&viewMode=story");
  const input = page.getByRole("combobox", { name: "語句" });
  await input.fill("blue");
  await input.press("Control+Enter");
  await expect(page.getByText("0語 / 送信1回", { exact: true })).toBeVisible();
  await expect(input).toHaveValue("blue");
  await page.getByRole("checkbox", { name: "フォーカスを外したら確定" }).focus();
  await page.keyboard.press("Space");
  await input.focus();
  await page.getByRole("checkbox", { name: "確認を省略" }).focus();
  await expect(page.getByRole("button", { name: /「blue」を書き直す/ })).toBeVisible();
  await expect(input).toHaveValue("");
});
