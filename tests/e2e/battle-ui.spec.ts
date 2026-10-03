import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { BattleSettings } from "../../src/features/battle/battle-state";

// 画面の操作で対戦をはじめ、生成・提出・結果まで進める。
// 匿名参加の回数制限がほかのテストと合算されないよう、送信元を分ける
const ip = (n: number) => ({ extraHTTPHeaders: { "CF-Connecting-IP": `203.0.113.${n}` } });
test.use(ip(40));
test.use({ reducedMotion: "reduce" });

const execFileAsync = promisify(execFile);

test.beforeAll(async () => {
  // 別プロセスのWranglerとpreviewが同じローカルSQLiteを開くため、競合したら少し待って再試行する
  for (let attempt = 0; ; attempt += 1) {
    try {
      await execFileAsync("vp", [
        "exec",
        "wrangler",
        "d1",
        "execute",
        "DB",
        "--local",
        "--persist-to",
        ".wrangler/e2e",
        "--command",
        // battle.spec.ts が easy のお題のURLを検証するため、画面のテストは normal のお題を使う
        "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-ui-topic', 'normal', 'http://127.0.0.1:4173/art/pink.twin.blue.sailor.smile.room.svg')",
      ]);
      return;
    } catch (error) {
      if (attempt >= 4 || !(error instanceof Error && error.message.includes("SQLITE_BUSY")))
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
});

async function enterName(page: Page, name: string) {
  await page.getByRole("button", { name: "ログインせずに進む" }).click();
  await page.getByLabel("表示名", { exact: true }).fill(name);
}

test("ロビーから対戦をはじめ、生成した画像を提出して結果を見る", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await page.goto("/rooms/new");
  await enterName(page, "ホスト");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[23456789A-HJKMNP-Z]{8}$/, { timeout: 15_000 });
  const code = new URL(page.url()).pathname.split("/").pop() ?? "";

  const guestContext = await browser.newContext({ ...ip(41), reducedMotion: "reduce" });
  try {
    const guest = await guestContext.newPage();
    await guest.goto(`/rooms/${code}`);
    await enterName(guest, "ゲスト");
    await guest.getByRole("button", { name: "ルームに参加" }).click();
    await expect(page.getByText("準備OK 1 / 2人")).toBeVisible({ timeout: 15_000 });

    // 制限時間は画面の選択肢より短くし、検証時間を抑える
    const settings: BattleSettings = {
      difficulty: "normal",
      durationSeconds: 20,
      selectionSeconds: 5,
    };
    await page.evaluate((data) => window.animicTest.setRoomSettings({ data }), {
      code,
      settings,
      previousBattleId: null,
    });
    // ゲストには決まった条件が文章で見える
    await expect(guest.getByText("ふつう", { exact: true })).toBeVisible();
    await expect(guest.getByText("20秒", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "対戦をはじめる" }).click();
    // ゲストが準備中なので、そのまま始めてよいか確認してから始める
    const confirm = page.getByRole("dialog", { name: "全員の準備がまだです" });
    await expect(confirm.getByText("ゲスト", { exact: true })).toBeVisible();
    await confirm.getByRole("button", { name: "このままはじめる" }).click();
    await expect(page.getByRole("status").filter({ hasText: "お題が公開されます" })).toBeVisible();

    for (const participant of [page, guest]) {
      await expect(participant.getByRole("heading", { name: "お題" })).toBeVisible({
        timeout: 20_000,
      });
      await expect(participant.getByRole("img", { name: "お題のイラスト" })).toBeVisible();
      await expect(participant.getByRole("timer")).toContainText(/0:\d\d/);
    }

    // 生成して1枚選び、提出する
    await page.getByRole("textbox", { name: "プロンプト" }).fill("ピンクの髪でツインテール、笑顔");
    await page.getByRole("button", { name: "生成する" }).click();
    const shot = page.getByRole("button", { name: "1回目の画像" });
    await expect(shot).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("生成 1 回")).toBeVisible();
    await expect(guest.getByText("成功した生成 1回")).toBeVisible();
    await shot.click();
    await expect(shot).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "この1枚で提出" }).click();
    await page
      .getByRole("dialog", { name: "この1枚で提出しますか？" })
      .getByRole("button", { name: "提出する" })
      .click();
    await expect(page.getByRole("status").filter({ hasText: "提出しました！" })).toBeVisible();
    await expect(guest.getByText("提出済み", { exact: true }).first()).toBeVisible();

    // 相手が提出しないまま期限を過ぎると、提出した側の勝ち
    await expect(page.getByRole("heading", { name: "YOU WIN!" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("ゲスト さんに勝ちました！")).toBeVisible();
    await expect(guest.getByRole("heading", { name: "YOU LOSE…" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(guest.getByText("未提出")).toBeVisible();

    // 再戦でロビーへ戻る
    await page.getByRole("button", { name: "同じメンバーで再戦" }).click();
    await expect(page.getByRole("button", { name: "対戦をはじめる" })).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await guestContext.close();
  }
});
