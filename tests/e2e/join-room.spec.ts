import { test, expect } from "@playwright/test";
import { create } from "./api";
import { executeLocalD1 } from "./d1";
test.beforeAll(async () => {
  await executeLocalD1("DELETE FROM rate_limit");
});

for (const width of [1440, 390]) {
  test(`参加コードの末尾入力・文言・ボタンのフォーカス（${width}px）`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: /ルームに参加/ }).first();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "ルームに参加", exact: true });
    const input = dialog.getByRole("textbox", { name: "ルームコード（8文字）", exact: true });
    const submit = dialog.getByRole("button", { name: "参加する", exact: true });
    const message = dialog.locator('[data-part="helper-text"], [data-part="error-text"]');
    await expect(input).toBeFocused();
    await expect(message).toHaveText("");
    await expect(submit).toBeDisabled();
    const initial = await submit.boundingBox();
    await input.pressSequentially("ab23");
    await expect(input).toHaveValue("AB23");
    await expect(message).toHaveText("あと4文字");
    const firstCell = await dialog.locator(".animic-code-input__cell").first().boundingBox();
    await page.mouse.click(firstCell!.x + 4, firstCell!.y + 4);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Home");
    await page.keyboard.insertText("c");
    await expect(input).toHaveValue("AB23C");
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("AB23");
    await page.evaluate(() => navigator.clipboard.writeText("abcd-23 45xy"));
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+V");
    await expect(input).toHaveValue("ABCD2345");
    await expect(message).toHaveText("このコードで参加します");
    await expect(submit).toBeEnabled();
    await page.keyboard.press("Backspace");
    await page.keyboard.insertText("i");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveCount(1);
    await expect(message).toHaveText("「I」はルームコードに使われていません");
    await expect(submit).toBeDisabled();
    expect((await submit.boundingBox())!.y).toBeCloseTo(initial!.y, 0);
    await page.keyboard.press("Tab");
    const cancel = dialog.getByRole("button", { name: "やめる" });
    await expect(cancel).toBeFocused();
    await expect(cancel).toHaveCSS("outline-style", "none");
    await expect(cancel).toHaveCSS("text-decoration-line", "underline");
    await page.keyboard.press("Enter");
    await expect(dialog).toHaveCount(0);
    await trigger.click();
    await expect(input).toHaveValue("");
    await expect(message).toHaveText("");
    await input.fill("aaaaaaaa");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
    await expect(dialog).toBeVisible();
    await expect(input).toHaveValue("AAAAAAAA");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveCount(1);
    await expect(message).toHaveText("ルームが見つかりません");
    expect((await submit.boundingBox())!.y).toBeCloseTo(initial!.y, 0);
    await input.press("Backspace");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveText("あと1文字");
    await cancel.click();
    await trigger.click();
    await expect(input).toHaveValue("");
    await expect(message).toHaveText("");
    const creator = await context.newPage();
    const code = await create(creator);
    await input.fill(code.toLowerCase());
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => url.pathname === `/rooms/${code}` && url.search === "");
  });
}
