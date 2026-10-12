import { expect, test } from "@playwright/test";
import type { WebSocketRoute } from "@playwright/test";

import { create, join } from "./api";
import { executeLocalD1 } from "./d1";

// 帯とお題の裏返しの演出を省き、対戦画面の操作だけを確認する。
test.use({ reducedMotion: "reduce" });

test.beforeAll(async () => {
  // E2Eは同じIPから続けて匿名参加するため、ほかのテストファイルの回数制限の記録を持ち越さない。
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg'); DELETE FROM rate_limit",
  );
});

test("対戦画面でプロンプトを入力し、候補・重み・検索・お題の拡大・確認なしの設定を操作できる", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  const code = await create(page, "ホスト");
  const guestContext = await browser.newContext({ reducedMotion: "reduce" });
  const guest = await guestContext.newPage();
  try {
    await join(guest, code, "ゲスト");
    // 操作の途中で時間切れにならないよう、長い対戦にする。
    const started = await page.evaluate(async (roomCode) => {
      const data = {
        code: roomCode,
        settings: { difficulty: "easy" as const, durationSeconds: 600, selectionSeconds: 10 },
        previousBattleId: null,
      };
      await window.animicTest.setRoomSettings({ data });
      return window.animicTest.startBattle({ data });
    }, code);
    expect(started.error).toBeNull();
    await page.goto(`/rooms/${code}`);
    await guest.goto(`/rooms/${code}`);
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("timer")).toBeVisible();
    }
    // 選べる画像がまだないうちは、選ぶように促さない。
    await expect(page.getByText("まだ画像がありません").first()).toBeVisible();
    await expect(page.getByText("画像を1枚選んでください")).toHaveCount(0);

    // ロスターは2人。自分だけ状態と生成回数を出す。
    const roster = page.getByRole("list", { name: "プレイヤーの様子" });
    await expect(roster.getByRole("listitem")).toHaveCount(2);
    await expect(roster.getByRole("listitem", { name: /ホスト.*考え中・生成 0回/ })).toBeVisible();
    await expect(
      guest
        .getByRole("list", { name: "プレイヤーの様子" })
        .getByRole("listitem", { name: /^ホスト: ?$/ }),
    ).toBeVisible();

    // プロンプトが空の間は「生成する」を押せず、理由を出す。
    await expect(page.getByRole("button", { name: "生成する", exact: true })).toBeDisabled();
    await expect(page.getByText("プロンプトを入力してください")).toBeVisible();
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await input.press("ControlOrMeta+Enter");
    await expect(
      page.getByRole("status").filter({ hasText: "プロンプトを入力してください" }),
    ).toBeVisible();

    // 区切りを書くと語句になる。
    await input.fill("ピンクの髪、");
    await expect(page.getByRole("button", { name: "「ピンクの髪」を書き直す" })).toBeVisible();
    await expect(page.getByText("1語（合計 1語）")).toBeVisible();

    // 入力候補から選ぶ。
    await input.fill("ついん");
    const suggestions = page.getByRole("listbox", { name: "入力候補" });
    await expect(suggestions.getByRole("option", { name: /ツインテール/ }).first()).toBeVisible();
    await input.press("Enter");
    await expect(page.getByRole("button", { name: "「ツインテール」を書き直す" })).toBeVisible();
    await expect(input).toHaveValue("");

    // 重みを上げ下げする。
    await page.getByRole("button", { name: "「ツインテール」を強くする" }).click();
    await expect(
      page.getByRole("button", { name: "「ツインテール」を書き直す（重み 1.1）" }),
    ).toBeVisible();

    // 空のままBackspaceで、最後の語句を書き直しに戻す。
    await input.press("Backspace");
    await expect(input).toHaveValue("ツインテール");
    await expect(page.getByRole("button", { name: "「ツインテール」を書き直す" })).toHaveCount(0);
    await input.press("Enter");
    await expect(page.getByRole("button", { name: "「ツインテール」を書き直す" })).toBeVisible();

    // タグの入力に切り替えると、区切りの案内が英語のタグの例になり、辞書にある語句はタグの表記になる。
    const modes = page.getByRole("radiogroup", { name: "入力方法" });
    await modes.getByText("タグ").click();
    await expect(page.getByRole("radio", { name: "タグ" })).toBeChecked();
    await expect(input).toHaveAttribute("placeholder", /「,」/);
    await expect(page.getByRole("button", { name: "「pink hair」を書き直す" })).toBeVisible();
    await expect(page.getByRole("button", { name: "「twintails」を書き直す" })).toBeVisible();
    // 文章に戻すと、日本語の表記に戻る。
    await modes.getByText("文章").click();
    await expect(page.getByRole("button", { name: "「ピンクの髪」を書き直す" })).toBeVisible();
    await modes.getByText("タグ").click();
    await expect(page.getByRole("button", { name: "「pink hair」を書き直す" })).toBeVisible();

    // ベースの欄に切り替える。
    await page
      .getByRole("radiogroup", { name: "プロンプトの種類" })
      .getByText("ベース", { exact: true })
      .click();
    await expect(page.getByText("0語（合計 2語）")).toBeVisible();

    // ⌘/Ctrl+Kで検索を開き、カードを押して欄に入れる。
    await page.keyboard.press("ControlOrMeta+k");
    const search = page.getByRole("dialog", { name: "ベースプロンプトを検索" });
    await expect(search).toBeVisible();
    await search.getByRole("searchbox", { name: "プロンプトを検索" }).fill("背景");
    await expect(search.getByText(/の結果 \d+件/)).toBeVisible();
    const card = search.getByRole("button").filter({ hasText: "white background" });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(
      search
        .locator('[data-scope="segment-group"][data-part="item"]')
        .filter({
          has: page.getByRole("radio", { name: "背景", exact: true }),
        })
        .getByText("1", { exact: true }),
    ).toBeVisible();
    await search.getByRole("button", { name: "決定" }).click();
    await expect(search).toBeHidden();
    await expect(
      page.getByRole("button", { name: "「white background」を書き直す" }),
    ).toBeVisible();

    // お題を拡大して全体を見る。
    await page.getByRole("button", { name: "お題のイラストを拡大" }).click();
    const zoom = page.getByRole("dialog", { name: "お題" });
    await expect(zoom).toBeVisible();
    await zoom.locator("label").filter({ hasText: "2倍" }).click();
    await expect(zoom.getByRole("radio", { name: "2倍", exact: true })).toBeChecked();
    // 「閉じる」で閉じても、Escで閉じたときと同じく次は全体の表示から始める。
    await zoom.getByRole("button", { name: "閉じる" }).click();
    await expect(zoom).toBeHidden();
    await page.getByRole("button", { name: "お題のイラストを拡大" }).click();
    await expect(zoom.getByRole("radio", { name: "全体", exact: true })).toBeChecked();
    await zoom.getByRole("button", { name: "閉じる" }).click();
    await expect(zoom).toBeHidden();

    // 「確認なしですぐ提出」はこの端末に覚えておく。
    await page.getByText("確認なしですぐ提出", { exact: true }).click();
    const quick = page.getByRole("checkbox", { name: "確認なしですぐ提出" });
    await expect(quick).toBeChecked();
    await page.reload();
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "確認なしですぐ提出" })).toBeChecked();

    // 狭い画面でも横にはみ出さず、入力欄を操作できる。
    await page.setViewportSize({ width: 320, height: 568 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole("combobox", { name: /^プロンプト/ })).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("むずかしいではキャラの欄を最初から2つ出し、足したり消したりさせない", async ({
  page,
  browser,
}) => {
  // Wranglerでのお題の登録と2人の接続を含むため、既定の30秒より長くする。
  test.setTimeout(60_000);
  // ほかのテストで「この難易度のお題がありません」を確かめるため、このテストの中だけお題を置く。
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic-hard', 'hard', 'https://example.invalid/animic-topic-hard.svg')",
  );
  const guestContext = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const code = await create(page, "ホスト");
    await join(await guestContext.newPage(), code, "ゲスト");
    const started = await page.evaluate(
      async (data) => {
        await window.animicTest.setRoomSettings({ data });
        return window.animicTest.startBattle({ data });
      },
      {
        code,
        settings: { difficulty: "hard" as const, durationSeconds: 600, selectionSeconds: 10 },
        previousBattleId: null,
      },
    );
    expect(started.error).toBeNull();
    await page.goto(`/rooms/${code}`);
    await expect(page.getByRole("timer")).toBeVisible();

    await expect(page.getByRole("radio", { name: "キャラ1", checked: true })).toBeVisible();
    await page
      .getByRole("radiogroup", { name: "プロンプトの種類" })
      .getByText("キャラ2", { exact: true })
      .click();
    await expect(page.getByRole("radio", { name: "キャラ2", checked: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "プロンプト（キャラ2）" })).toBeVisible();
    await expect(page.getByRole("button", { name: /キャラ2/ })).toHaveCount(0);
  } finally {
    await guestContext.close();
    await executeLocalD1("DELETE FROM topic WHERE id = 'e2e-topic-hard'");
  }
});

test("時間切れで提出できる画像がなければ、提出の操作を出さずにそのことを表示する", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  // 匿名参加の回数制限を、ほかのテストと分けて数える。
  const guestContext = await browser.newContext({
    reducedMotion: "reduce",
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.37" },
  });
  try {
    const code = await create(page, "ホスト");
    await join(await guestContext.newPage(), code, "ゲスト");
    await page.evaluate(async (roomCode) => {
      const data = {
        code: roomCode,
        settings: { difficulty: "easy" as const, durationSeconds: 600, selectionSeconds: 10 },
        previousBattleId: null,
      };
      await window.animicTest.setRoomSettings({ data });
      await window.animicTest.startBattle({ data });
    }, code);
    const participantId = await page.evaluate(
      async () => (await window.animicTest.getCurrentParticipant())?.id,
    );
    const room = await page.evaluate(() => window.animicTest.snapshot());
    if (!room?.battle || !participantId) throw new Error("対戦が開始されていません。");
    // サーバーはこの状態の参加者をすぐに未提出として確定するため、確定が届く前の配信に差し替える。
    room.version += 100;
    room.battle.generationClosed = true;
    room.battle.selectionEndsAt = room.battle.serverTime + 10_000;
    room.battle.myGenerations = [
      {
        id: "a",
        status: "failed",
        acceptedAt: room.battle.startedAt,
        finishedAt: room.battle.startedAt + 1000,
      },
    ];
    let connection: WebSocketRoute | undefined;
    await page.routeWebSocket("**/connection", (socket) => {
      connection = socket;
      socket.send(JSON.stringify(room));
    });
    await page.goto(`/rooms/${code}`);
    await expect(page.getByRole("heading", { name: "時間切れ", exact: true })).toBeVisible();
    await expect(page.getByText("生成終了！")).toHaveCount(0);
    await expect(page.getByText("時間切れのため提出できません")).toBeVisible();
    await expect(page.getByRole("img", { name: "提出できる画像がありません" })).toBeVisible();
    await expect(page.getByText("時間内に完成した画像はありませんでした")).toBeVisible();
    await expect(page.getByRole("button", { name: "1回目・失敗", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "この1枚で提出" })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "確認なしですぐ提出" })).toHaveCount(0);

    // 未提出の確定が届いたら、未提出の全面表示に切り替える。
    room.version++;
    room.battle.mySubmission = {
      participantId,
      status: "not-submitted",
      decidedAt: room.battle.generationEndsAt,
    };
    if (!connection) throw new Error("ルームに接続していません。");
    connection.send(JSON.stringify(room));
    await expect(page.getByRole("dialog", { name: "時間内に提出できませんでした" })).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("提出に失敗した表示を、選び直したり別の画像を選んだりしたら残さない", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const guestContext = await browser.newContext({
    reducedMotion: "reduce",
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.38" },
  });
  try {
    const code = await create(page, "ホスト");
    await join(await guestContext.newPage(), code, "ゲスト");
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
    // サーバーにない画像を配信に差し込み、提出を失敗させる。
    room.version += 100;
    room.battle.myGenerations = ["a", "b"].map((id, index) => ({
      id,
      status: "succeeded" as const,
      acceptedAt: room.battle!.startedAt + index * 2000,
      finishedAt: room.battle!.startedAt + index * 2000 + 1000,
      imageUrl: `https://example.invalid/${id}.svg`,
    }));
    await page.routeWebSocket("**/connection", (socket) => {
      socket.send(JSON.stringify(room));
    });
    await page.goto(`/rooms/${code}`);
    const confirm = page.getByRole("dialog", { name: "提出してもよろしいですか？" });
    await page.getByRole("button", { name: "この1枚で提出", exact: true }).click();
    await confirm.getByRole("button", { name: "提出する" }).click();
    await expect(confirm.getByRole("alert")).toHaveText(
      "提出できませんでした。もう一度押してください",
    );
    // 確認の表示中は後ろの画面を読み上げの対象から外すため、隠れた要素も含めて探す。
    await expect(
      page.getByRole("button", { name: "もう一度提出", includeHidden: true }),
    ).toBeAttached();

    // 選び直したら、前の失敗の表示を消す。
    await confirm.getByRole("button", { name: "選び直す" }).click();
    await expect(confirm).toBeHidden();
    await expect(page.getByRole("button", { name: "この1枚で提出", exact: true })).toBeVisible();

    // 別の画像の確認に、前の失敗の表示を持ち越さない。
    await page
      .getByRole("button", { name: "1回目の画像", exact: true, includeHidden: true })
      .click();
    await page.getByRole("button", { name: "この1枚で提出", exact: true }).click();
    await expect(confirm.getByRole("img", { name: "提出する画像" })).toHaveAttribute(
      "src",
      "https://example.invalid/a.svg",
    );
    await expect(confirm.getByRole("alert")).toHaveCount(0);
    await confirm.getByRole("button", { name: "提出する" }).click();
    await expect(confirm.getByRole("alert")).toBeVisible();
    await confirm.getByRole("button", { name: "選び直す" }).click();

    // 確認なしの提出で失敗した後も、別の画像を選んだら失敗の表示を消す。
    await page.getByText("確認なしですぐ提出", { exact: true }).click();
    await page.getByRole("button", { name: "この1枚で提出", exact: true }).click();
    await expect(page.getByRole("button", { name: "もう一度提出" })).toBeVisible();
    await page
      .getByRole("button", { name: "2回目の画像", exact: true, includeHidden: true })
      .click();
    await expect(page.getByRole("button", { name: "この1枚で提出", exact: true })).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("手元の残り時間が0になったら、締切の配信を待たずに生成と提出を止める", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const guestContext = await browser.newContext({
    reducedMotion: "reduce",
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.39" },
  });
  try {
    const code = await create(page, "ホスト");
    await join(await guestContext.newPage(), code, "ゲスト");
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
    // 締切の配信が届かないよう、サーバーの代わりに配信する。
    room.version += 100;
    room.battle.generationEndsAt = room.battle.serverTime + 4000;
    room.battle.myGenerations = [
      {
        id: "a",
        status: "succeeded",
        acceptedAt: room.battle.startedAt,
        finishedAt: room.battle.startedAt + 1000,
        imageUrl: "https://example.invalid/a.svg",
      },
    ];
    let connection: WebSocketRoute | undefined;
    await page.routeWebSocket("**/connection", (socket) => {
      connection = socket;
      socket.send(JSON.stringify(room));
    });
    await page.goto(`/rooms/${code}`);
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await expect(input).toBeEnabled();
    await expect(page.getByRole("timer")).toHaveText(/0:00/, { timeout: 10_000 });
    await expect(input).toBeDisabled();
    await expect(page.getByRole("button", { name: "生成する", exact: true })).toBeDisabled();
    // 生成の期限の後も画像選択の猶予の間は提出できるため、提出は止めない。
    await expect(page.getByRole("button", { name: "この1枚で提出", exact: true })).toBeEnabled();

    // 画像選択の猶予が0になったら、提出を止める。
    room.version++;
    room.battle.generationClosed = true;
    room.battle.serverTime = room.battle.generationEndsAt;
    room.battle.selectionEndsAt = room.battle.serverTime + 3000;
    if (!connection) throw new Error("ルームに接続していません。");
    connection.send(JSON.stringify(room));
    const submit = page.getByRole("button", { name: "この1枚で提出", exact: true });
    await expect(page.getByRole("heading", { name: "生成終了！" })).toBeVisible();
    await expect(submit).toBeEnabled();
    await submit.click();
    const confirm = page.getByRole("dialog", { name: "提出してもよろしいですか？" });
    await expect(confirm).toBeVisible();
    await expect(confirm).toBeHidden({ timeout: 10_000 });
    await expect(submit).toBeDisabled();
  } finally {
    await guestContext.close();
  }
});

test("配信が形に合わないときも案内し、正しく受信した後の失敗でも再び案内する", async ({
  page,
  browser,
}) => {
  const guestContext = await browser.newContext({
    reducedMotion: "reduce",
    extraHTTPHeaders: { "CF-Connecting-IP": "203.0.113.40" },
  });
  try {
    const code = await create(page, "ホスト");
    await join(await guestContext.newPage(), code, "ゲスト");
    const room = await page.evaluate(() => window.animicTest.snapshot());
    if (!room) throw new Error("ルームに参加していません。");
    let connection: WebSocketRoute | undefined;
    await page.routeWebSocket("**/connection", (socket) => {
      connection = socket;
    });
    await page.goto(`/rooms/${code}`);
    await expect.poll(() => connection).toBeDefined();
    const notice = page.getByText("受信した情報を確認できませんでした。");
    connection!.send(JSON.stringify({ ...room, version: room.version + 1, members: "壊れた値" }));
    await expect(notice).toBeVisible();
    await expect(notice).toBeHidden();
    connection!.send(JSON.stringify({ ...room, version: room.version + 1 }));
    connection!.send(JSON.stringify({ ...room, version: room.version + 2, closed: "壊れた値" }));
    await expect(notice).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
