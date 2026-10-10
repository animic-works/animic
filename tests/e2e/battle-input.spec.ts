import { expect, test } from "@playwright/test";
import type { Browser, Page, WebSocketRoute } from "@playwright/test";
import { create, join } from "./api";
import { executeLocalD1 } from "./d1";

test.use({ reducedMotion: "reduce" });
// 同じ難易度のお題を残すと、ほかのテストの出題が入れ替わるため片付ける。
test.afterAll(async () => {
  await executeLocalD1("DELETE FROM topic WHERE id = 'e2e-input-topic'");
});
test("日本語の変換中は区切りを含む入力を保持し、変換後に語句にする", async ({ page, browser }) => {
  test.setTimeout(60000);
  const inputWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /controlled|defaultValue/.test(message.text()))
      inputWarnings.push(message.text());
  });
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
    // 書きかけが空の状態へ、区切りで終わる複数語句を貼り付けてもDOMに残さない。
    await input.fill("ピンクの髪、ツインテール、笑顔、");
    await expect(input).toHaveValue("");
    for (const word of ["ピンクの髪", "ツインテール", "笑顔"]) {
      await expect(page.getByRole("button", { name: `「${word}」を書き直す` })).toBeVisible();
    }
    expect(inputWarnings).toEqual([]);
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

/** 2人のルームで長い対戦を始め、ホストの対戦画面を開く。ゲストのコンテキストを返す */
async function openBattle(page: Page, browser: Browser) {
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-input-topic', 'easy', 'https://example.invalid/topic.svg'); DELETE FROM rate_limit",
  );
  const code = await create(page);
  const guest = await browser.newContext();
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
  return guest;
}

test("再読み込みしても、すべての欄の語句・書きかけ・入力方法を戻す", async ({ page, browser }) => {
  test.setTimeout(60000);
  const guest = await openBattle(page, browser);
  try {
    const chara = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await chara.fill("ピンクの髪、ツインテール、");
    await page.getByRole("button", { name: "「ツインテール」を強くする" }).click();
    const kinds = page.getByRole("radiogroup", { name: "プロンプトの種類" });
    await kinds.getByText("ベース", { exact: true }).click();
    await page.getByRole("radiogroup", { name: "入力方法" }).getByText("タグ").click();
    const base = page.getByRole("combobox", { name: "プロンプト（ベース）" });
    await base.fill("white background, sketch");
    await expect(
      page.getByRole("button", { name: "「white background」を書き直す" }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("radio", { name: "タグ" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "ベース", checked: true })).toBeVisible();
    await expect(base).toHaveValue("sketch");
    await expect(
      page.getByRole("button", { name: "「white background」を書き直す" }),
    ).toBeVisible();
    await expect(page.getByText("1語（合計 3語）")).toBeVisible();
    await kinds.getByText("キャラ", { exact: true }).click();
    await expect(page.getByRole("button", { name: "「ピンクの髪」を書き直す" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "「ツインテール」を書き直す（重み 1.1）" }),
    ).toBeVisible();
  } finally {
    await guest.close();
  }
});

test("空欄でBackspaceを押し続けても、書き直しに戻す語句は1つだけにする", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const guest = await openBattle(page, browser);
  try {
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await input.fill("ねこ、いぬ、とり、");
    await expect(page.getByText("3語（合計 3語）")).toBeVisible();
    // 押しっぱなしにすると、2回目以降のkeydownはrepeatになる
    for (let count = 0; count < 12; count++) await page.keyboard.down("Backspace");
    await page.keyboard.up("Backspace");
    await expect(input).toHaveValue("");
    await expect(page.getByRole("button", { name: "「ねこ」を書き直す" })).toBeVisible();
    await expect(page.getByRole("button", { name: "「いぬ」を書き直す" })).toBeVisible();
    await expect(page.getByRole("button", { name: "「とり」を書き直す" })).toHaveCount(0);
    // 押し直せば、次の語句を書き直しに戻せる
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("いぬ");
  } finally {
    await guest.close();
  }
});

test("「このプロンプトを空にする」は確かめてから空にする", async ({ page, browser }) => {
  test.setTimeout(60000);
  const guest = await openBattle(page, browser);
  try {
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await input.fill("ねこ、いぬ、");
    await page.getByRole("button", { name: "このプロンプトを空にする" }).click();
    const confirm = page.getByRole("dialog", { name: "キャラのプロンプトを空にしますか？" });
    await confirm.getByRole("button", { name: "やめる" }).click();
    await expect(confirm).toBeHidden();
    await expect(page.getByText("2語（合計 2語）")).toBeVisible();
    await page.getByRole("button", { name: "このプロンプトを空にする" }).click();
    await confirm.getByRole("button", { name: "空にする", exact: true }).click();
    await expect(confirm).toBeHidden();
    await expect(page.getByText("0語（合計 0語）")).toBeVisible();
    await expect(input).toBeFocused();
  } finally {
    await guest.close();
  }
});
