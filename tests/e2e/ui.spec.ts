import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

import type { BattleSettings } from "../../src/features/battle/battle-state";
import { executeLocalD1 } from "./d1";

const shortSettings: BattleSettings = {
  difficulty: "easy",
  durationSeconds: 2,
  selectionSeconds: 1,
};

// 帯の演出を省き、画面の切り替えだけを確認する（演出は個別のテストで確認する）。
test.use({ reducedMotion: "reduce" });

test.beforeAll(async () => {
  // E2Eは同じIPから続けて匿名参加するため、ほかのテストファイルの回数制限の記録を持ち越さない。
  await executeLocalD1(
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg'); DELETE FROM rate_limit",
  );
});

async function createFromTop(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("link", { name: "スタート" }).first().click();
  await expect(page).toHaveURL("/start");
  await page.getByRole("textbox", { name: "表示名" }).fill(name);
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  await expect(page.getByRole("heading", { name: "ルール" })).toBeVisible();
  return new URL(page.url()).pathname.split("/").at(-1) ?? "";
}

async function joinByUrl(browser: Browser, code: string, name: string) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`/rooms/${code.toLowerCase()}`);
  await expect(page).toHaveURL(`/rooms/${code}`);
  await expect(page.getByText(`ルーム ${code} に参加します`)).toBeVisible();
  await page.getByRole("textbox", { name: "表示名" }).fill(name);
  await page.getByRole("button", { name: "ルームに参加" }).click();
  await expect(page.getByRole("heading", { name: "ルール" })).toBeVisible();
  return { context, page };
}

// 画面の選択肢は60秒からのため、検証用クライアントで短い制限時間を保存してから画面で開始する。
async function saveShortSettings(page: Page, code: string, previousBattleId: string | null) {
  await page.waitForFunction(() => Boolean(window.animicTest));
  await page.evaluate((data) => window.animicTest.setRoomSettings({ data }), {
    code,
    settings: shortSettings,
    previousBattleId,
  });
  // 開始時は画面に表示中の条件を送るため、保存した制限時間が画面に届くのを待つ。
  // 候補にない値は、ロビーの選択肢に加えて選んだ状態で表示する。
  await expect(
    page
      .getByRole("radiogroup", { name: "制限時間" })
      .getByRole("radio", { name: `${shortSettings.durationSeconds}秒` }),
  ).toBeChecked();
}

test("トップから作ったルームにURLから参加し、対戦の勝負不成立から再戦できる", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const code = await createFromTop(page, "ホスト");
  const guest = await joinByUrl(browser, code, "ゲスト");
  try {
    await expect(page.getByText("ゲスト", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "対戦をはじめる" })).toBeEnabled();

    await page.getByRole("radiogroup", { name: "制限時間" }).getByText("60秒").click();
    await expect(page.getByRole("radio", { name: "60秒" })).toBeChecked();
    await expect(guest.page.getByText("60秒")).toBeVisible();

    await guest.page.getByRole("button", { name: "準備完了にする" }).click();
    await expect(guest.page.getByRole("button", { name: "準備完了を取り消す" })).toBeVisible();
    await expect(page.getByText("準備OK 2 / 2人")).toBeVisible();

    await saveShortSettings(page, code, null);
    await page.getByRole("button", { name: "対戦をはじめる" }).click();
    for (const participant of [page, guest.page]) {
      await expect(participant.getByRole("timer")).toBeVisible();
      await expect(participant.getByText("まだ画像がありません。")).toBeVisible();
      await expect(participant.getByRole("button", { name: "この1枚で提出" })).toBeDisabled();
    }
    for (const participant of [page, guest.page]) {
      await expect(participant.getByRole("heading", { name: "NO GAME" })).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        participant.getByText("どちらも提出しなかったため、勝負不成立です"),
      ).toBeVisible();
      await expect(participant.getByText("未提出", { exact: true })).toHaveCount(2);
    }

    await page.getByRole("button", { name: "同じメンバーで再戦" }).click();
    await expect(page.getByRole("heading", { name: "ルール" })).toBeVisible();
    await expect(guest.page.getByRole("heading", { name: "NO GAME" })).toBeVisible();
    const previousBattleId = await page.evaluate(
      async (value) =>
        (await window.animicTest.getRoomEntry({ data: { code: value } })).room?.battle?.id,
      code,
    );
    await saveShortSettings(page, code, previousBattleId ?? null);
    await page.getByRole("button", { name: "対戦をはじめる" }).click();
    // 全員の準備ができていなければ、開始前に確認する。
    await expect(page.getByRole("heading", { name: "全員の準備がまだです" })).toBeVisible();
    await page.getByRole("button", { name: "このままはじめる" }).click();
    // 結果を見ている参加者の表示も、次の対戦へ切り替わる。
    for (const participant of [page, guest.page]) {
      await expect(participant.getByRole("timer")).toBeVisible();
    }
  } finally {
    await guest.context.close();
  }
});

test("開始できない理由を表示する", async ({ page, browser }) => {
  await createFromTop(page, "ひとりのホスト");
  const start = page.getByRole("button", { name: "対戦をはじめる" });
  await expect(start).toBeDisabled();
  await expect(page.getByText("接続中の参加者が2人のときに開始できます")).toBeVisible();

  const code = new URL(page.url()).pathname.split("/").at(-1) ?? "";
  const guest = await joinByUrl(browser, code, "お題待ち");
  try {
    await page.getByRole("radiogroup", { name: "難易度" }).getByText("むずかしい").click();
    await expect(page.getByRole("radio", { name: "むずかしい" })).toBeChecked();
    await guest.page.getByRole("button", { name: "準備完了にする" }).click();
    await expect(page.getByText("準備OK 2 / 2人")).toBeVisible();
    await start.click();
    await expect(
      page.getByText("この難易度のお題がありません。別の難易度を選んでください。"),
    ).toBeVisible();
  } finally {
    await guest.context.close();
  }
});

test("ルームコードの入力で使えない文字を知らせ、正しいコードでルームへ移動する", async ({
  page,
  browser,
}) => {
  const code = await createFromTop(page, "作成者");
  const visitor = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const top = await visitor.newPage();
    await top.goto("/");
    await top.getByRole("button", { name: "ロビーに参加する" }).click();
    let dialog = top.getByRole("dialog", { name: "ルームに参加" });
    const first = "ルームコードの1文字目（全8文字）";
    await expect(dialog.getByRole("textbox", { name: first })).toBeFocused();
    await top.keyboard.type("0");
    await expect(dialog.getByText("「0」はルームコードに使われていません")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "参加する" })).toBeDisabled();
    // ヘッダーの「ルームに参加」からも開ける。
    await top.reload();
    await top.getByRole("link", { name: "ルームに参加", exact: true }).click();
    dialog = top.getByRole("dialog", { name: "ルームに参加" });
    await expect(dialog.getByRole("textbox", { name: first })).toBeFocused();
    await top.keyboard.type(code.toLowerCase());
    await expect(dialog.getByText("このコードで参加します")).toBeVisible();
    await dialog.getByRole("button", { name: "参加する" }).click();
    await expect(top).toHaveURL(`/rooms/${code}`);
    await expect(top.getByText(`ルーム ${code} に参加します`)).toBeVisible();
  } finally {
    await visitor.close();
  }
});

test("招待のダイアログでルームURLとコードとQRコードを表示する", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const code = await createFromTop(page, "招待する人");
  await page.getByRole("button", { name: "招待する" }).first().click();
  const dialog = page.getByRole("dialog", { name: "友だちを招待" });
  await expect(dialog.getByLabel("ルームURL", { exact: true })).toHaveValue(
    new RegExp(`/rooms/${code}$`),
  );
  await expect(dialog.getByText(code, { exact: true })).toBeVisible();
  await expect(dialog.getByRole("img", { name: "ルームURLのQRコード" })).toBeVisible();
  await dialog.getByRole("button", { name: "リンクをコピー" }).click();
  await expect(page.getByText("招待リンクをコピーしました")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    new RegExp(`/rooms/${code}$`),
  );
});

test("ホストが退出するとトップへ戻り、残った参加者にホストを引き継ぐ", async ({
  page,
  browser,
}) => {
  const code = await createFromTop(page, "先に来た人");
  const guest = await joinByUrl(browser, code, "後から来た人");
  try {
    await page.getByRole("button", { name: "退出" }).click();
    await page
      .getByRole("alertdialog", { name: "ルームを出ますか？" })
      .getByRole("button", { name: "退出する" })
      .click();
    await expect(page).toHaveURL("/");
    await expect(guest.page.getByRole("button", { name: "対戦をはじめる" })).toBeVisible();
  } finally {
    await guest.context.close();
  }
});

test("別のタブで退出したら、接続を続けられない理由とトップへのリンクを表示する", async ({
  page,
  context,
}) => {
  test.setTimeout(45_000);
  const code = await createFromTop(page, "タブの多い人");
  const other = await context.newPage();
  await other.goto(`/rooms/${code}`);
  await expect(other.getByRole("heading", { name: "ルール" })).toBeVisible();
  await page.getByRole("button", { name: "退出" }).click();
  await page
    .getByRole("alertdialog", { name: "ルームを出ますか？" })
    .getByRole("button", { name: "退出する" })
    .click();
  // 退出した接続の終了は、すぐには届かないことがある（room.spec.tsと同じ待ち時間）。
  await expect(other.getByText("ルームから退出しました。")).toBeVisible({ timeout: 35_000 });
  await expect(other.getByRole("heading", { name: "ルール" })).toHaveCount(0);
  await other.getByRole("link", { name: "トップへ戻る" }).click();
  await expect(other).toHaveURL("/");
});

test("対戦中に参加した人には、次の対戦を待つことを表示する", async ({ page, browser }) => {
  const code = await createFromTop(page, "対戦中のホスト");
  const guest = await joinByUrl(browser, code, "対戦中のゲスト");
  try {
    await page.getByRole("button", { name: "対戦をはじめる" }).click();
    await page.getByRole("button", { name: "このままはじめる" }).click();
    await expect(page.getByRole("timer")).toBeVisible();
    const late = await joinByUrl(browser, code, "途中参加");
    try {
      await expect(late.page.getByText("対戦中です。次の対戦から参加できます。")).toBeVisible();
      await expect(late.page.getByRole("button", { name: "準備完了にする" })).toBeDisabled();
    } finally {
      await late.context.close();
    }
  } finally {
    await guest.context.close();
  }
});

test.describe("画面遷移の演出", () => {
  test.use({ reducedMotion: "no-preference" });

  test("ルーム作成の演出はスキップのボタンで飛ばしてロビーへ進める", async ({ page }) => {
    await page.goto("/start");
    await page.getByRole("textbox", { name: "表示名" }).fill("演出確認");
    await page.getByRole("button", { name: "ルームを作る" }).click();
    await page.getByRole("button", { name: "演出をスキップしてロビーへ進む" }).click();
    await expect(page).toHaveURL(/\/rooms\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    await expect(page.getByRole("heading", { name: "ルール" })).toBeVisible();
  });

  test("ルーム作成の演出は任意のキーで飛ばせる", async ({ page }) => {
    await page.goto("/start");
    await page.getByRole("textbox", { name: "表示名" }).fill("キーで飛ばす");
    await page.getByRole("button", { name: "ルームを作る" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "ルームを作っています" }),
    ).toBeVisible();
    // 押した直後の誤操作を避けるため、受付開始まで待ってから押す。
    await page.waitForTimeout(500);
    await page.keyboard.press("x");
    // 演出を最後まで見ると5秒ほどかかる。
    await expect(page).toHaveURL(/\/rooms\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/, {
      timeout: 3000,
    });
  });
});

for (const [path, heading] of [
  ["/terms", "利用規約"],
  ["/privacy", "プライバシーポリシー"],
] as const) {
  test(`${path}に仮の文面と注記を表示し、検索対象にしない`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    await expect(page.getByText("現在は仮の文面です")).toBeVisible();
    // 直接開いて履歴がなければ、トップへ移動する。
    await page.getByRole("button", { name: "戻る" }).click();
    await expect(page).toHaveURL("/");
  });
}

test("トップのフッターから開いた利用規約は「戻る」で直前のページへ戻る", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("link", { name: "トップへ戻る" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "利用規約" }).click();
  await expect(page.getByRole("heading", { name: "利用規約", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "戻る" }).click();
  await expect(page).toHaveURL("/");
});

test("遊び方の手順を矢印・番号・左右キーで切り替える", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "遊び方" }).click();
  await expect(page).toHaveURL(/#how$/);
  const step = (name: string) => page.getByRole("button", { name });
  await page.getByRole("button", { name: "次の手順" }).click();
  await expect(step("ステップ2: お題が公開される")).toHaveAttribute("aria-current", "true");
  await step("ステップ4: 1枚を提出して勝負").click();
  await expect(step("ステップ4: 1枚を提出して勝負")).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("ArrowRight");
  await expect(step("ステップ1: ルームに集まる")).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(step("ステップ4: 1枚を提出して勝負")).toHaveAttribute("aria-current", "true");
});
