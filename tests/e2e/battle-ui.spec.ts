import { expect, test } from "@playwright/test";

import { create, join } from "./api";
import { executeLocalD1 } from "./d1";
import { createFromTop, joinByUrl, saveSettings } from "./screen";

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
  const code = await createFromTop(page, "ホスト");
  const guest = await joinByUrl(browser, code, "ゲスト");
  try {
    // 操作の途中で時間切れにならないよう、長い対戦にする。
    await saveSettings(
      page,
      code,
      { difficulty: "easy", durationSeconds: 600, selectionSeconds: 10 },
      null,
    );
    await page.getByRole("button", { name: "対戦をはじめる" }).click();
    await page.getByRole("button", { name: "このままはじめる" }).click();
    for (const participant of [page, guest.page]) {
      await expect(participant.getByRole("timer")).toBeVisible();
    }

    // ロスターは2人。自分だけ状態と生成回数を出す。
    const roster = page.getByRole("list", { name: "プレイヤーの様子" });
    await expect(roster.getByRole("listitem")).toHaveCount(2);
    await expect(
      roster.getByRole("listitem", { name: "ホスト（あなた）: 考え中・生成 0回" }),
    ).toBeVisible();
    await expect(
      guest.page
        .getByRole("list", { name: "プレイヤーの様子" })
        .getByRole("listitem", { name: "ホスト", exact: true }),
    ).toBeVisible();

    // 生成の処理をつなぐまでは「生成する」を押せず、理由を出す。
    await expect(page.getByRole("button", { name: "生成する", exact: true })).toBeDisabled();
    await expect(page.getByText("画像の生成は準備中です")).toBeVisible();
    const input = page.getByRole("combobox", { name: "プロンプト（キャラ）" });
    await input.press("ControlOrMeta+Enter");
    await expect(
      page.getByRole("status").filter({ hasText: "画像の生成は準備中です" }),
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

    // タグの入力に切り替えると、区切りの案内が英語のタグの例になる。
    await page.getByRole("radiogroup", { name: "入力方法" }).getByText("タグ").click();
    await expect(page.getByRole("radio", { name: "タグ" })).toBeChecked();
    await expect(input).toHaveAttribute("placeholder", /「,」/);

    // ベースの欄に切り替える。
    await page.getByRole("tab", { name: "ベース" }).click();
    await expect(page.getByText("0語（合計 2語）")).toBeVisible();

    // ⌘/Ctrl+Kで検索を開き、カードを押して欄に入れる。
    await page.keyboard.press("ControlOrMeta+k");
    const search = page.getByRole("dialog", { name: "ベースプロンプトを検索" });
    await expect(search).toBeVisible();
    await search.getByRole("searchbox", { name: "プロンプトを検索" }).fill("背景");
    await expect(search.getByText(/の結果 \d+件/)).toBeVisible();
    const card = search.getByRole("button", { name: /white background/ });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(
      search.getByRole("navigation", { name: "ジャンル" }).getByRole("button", { name: /背景/ }),
    ).toContainText("1");
    await search.getByRole("button", { name: "決定" }).click();
    await expect(search).toBeHidden();
    await expect(
      page.getByRole("button", { name: "「white background」を書き直す" }),
    ).toBeVisible();

    // お題を拡大して全体を見る。
    await page.getByRole("button", { name: "お題を拡大して全体を見る" }).click();
    const zoom = page.getByRole("dialog", { name: "お題" });
    await expect(zoom).toBeVisible();
    await zoom.getByRole("button", { name: "閉じる" }).click();
    await expect(zoom).toBeHidden();

    // 「確認なしですぐ提出」はこの端末に覚えておく。
    await page.getByText("確認なしですぐ提出", { exact: true }).click();
    const quick = page.getByRole("switch", { name: "確認なしですぐ提出" });
    await expect(quick).toBeChecked();
    await page.reload();
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByRole("switch", { name: "確認なしですぐ提出" })).toBeChecked();

    // 狭い画面でも横にはみ出さず、入力欄を操作できる。
    await page.setViewportSize({ width: 320, height: 568 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole("combobox", { name: /^プロンプト/ })).toBeVisible();
  } finally {
    await guest.context.close();
  }
});

test("むずかしいではキャラ2の欄を足して消せる", async ({ page, browser }) => {
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

    await expect(page.getByRole("tab", { name: "キャラ1", selected: true })).toBeVisible();
    await page.getByRole("button", { name: "＋ キャラ2" }).click();
    await expect(page.getByRole("tab", { name: "キャラ2", selected: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "プロンプト（キャラ2）" })).toBeVisible();
    await expect(page.getByRole("button", { name: "＋ キャラ2" })).toHaveCount(0);

    await page.getByRole("button", { name: "キャラ2を消す" }).click();
    await expect(page.getByRole("tab", { name: "キャラ2" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "キャラ1", selected: true })).toBeVisible();
  } finally {
    await guestContext.close();
    await executeLocalD1("DELETE FROM topic WHERE id = 'e2e-topic-hard'");
  }
});
