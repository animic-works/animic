import { expect, test } from "@playwright/test";
import type { WebSocketRoute } from "@playwright/test";
import { create, join } from "./api";
import { executeLocalD1 } from "./d1";

test.use({ reducedMotion: "reduce" });
test("日本語の変換中は区切りを含む入力を保持し、変換後に語句にする", async ({ page, browser }) => {
  test.setTimeout(60000);
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-input-topic', 'easy', 'https://example.invalid/topic.svg'); DELETE FROM rate_limit",
  );
  const code = await create(page);
  const guest = await browser.newContext();
  try {
    await join(await guest.newPage(), code, "ゲスト");
    await page.evaluate(async (roomCode) => {
      const data = {
        code: roomCode,
        settings: { difficulty: "easy" as const, durationSeconds: 600, selectionSeconds: 10 },
        previousBattleId: null,
      };
      await window.animicTest.setRoomSettings({ data });
      await window.animicTest.startBattle({ data });
    }, code);
    await page.goto(`/rooms/${code}`);
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await input.focus();
    await input.dispatchEvent("compositionstart", { data: "" });
    await input.evaluate((el) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, "ねこ、");
      el.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertCompositionText",
          data: "ねこ、",
          isComposing: true,
        }),
      );
    });
    await expect(input).toHaveValue("ねこ、");
    await expect(page.getByRole("button", { name: "「ねこ」を書き直す" })).toHaveCount(0);
    await input.dispatchEvent("compositionend", { data: "ねこ、" });
    await expect(input).toHaveValue("");
    await expect(page.getByRole("button", { name: "「ねこ」を書き直す" })).toBeVisible();
  } finally {
    await guest.close();
  }
});

test("提出確認中に生成が完成しても確認する画像を変えない", async ({ page, browser }) => {
  test.setTimeout(60000);
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-input-topic', 'easy', 'https://example.invalid/topic.svg'); DELETE FROM rate_limit",
  );
  const code = await create(page);
  const guest = await browser.newContext();
  try {
    await join(await guest.newPage(), code, "ゲスト");
    await page.evaluate(async (roomCode) => {
      const data = {
        code: roomCode,
        settings: { difficulty: "easy" as const, durationSeconds: 600, selectionSeconds: 10 },
        previousBattleId: null,
      };
      await window.animicTest.setRoomSettings({ data });
      await window.animicTest.startBattle({ data });
    }, code);
    const room = await page.evaluate(() => window.animicTest.snapshot());
    if (!room?.battle) throw new Error("対戦が開始されていません。");
    room.version += 100;
    room.battle.myGenerations = [
      {
        id: "a",
        status: "succeeded",
        acceptedAt: Date.now() - 2000,
        finishedAt: Date.now() - 1000,
        imageUrl: "https://example.invalid/a.svg",
      },
    ];
    let connection: WebSocketRoute | undefined;
    await page.routeWebSocket("**/connection", (socket) => {
      connection = socket;
      socket.send(JSON.stringify(room));
    });
    await page.goto(`/rooms/${code}`);
    await page.getByRole("button", { name: "この1枚で提出", exact: true }).click();
    const image = page
      .getByRole("dialog", { name: "提出してもよろしいですか？" })
      .getByRole("img", { name: "提出する画像" });
    await expect(image).toHaveAttribute("src", "https://example.invalid/a.svg");
    room.version++;
    room.battle.myGenerations.push({
      id: "b",
      status: "succeeded",
      acceptedAt: Date.now(),
      finishedAt: Date.now(),
      imageUrl: "https://example.invalid/b.svg",
    });
    if (!connection) throw new Error("ルームに接続していません。");
    connection.send(JSON.stringify(room));
    await expect(
      page.getByRole("button", { name: "2回目の画像", exact: true, includeHidden: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(image).toHaveAttribute("src", "https://example.invalid/a.svg");
  } finally {
    await guest.close();
  }
});
