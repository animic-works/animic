import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as v from "valibot";
import { expect, test } from "@playwright/test";

const execFileAsync = promisify(execFile);
async function queryLocalResults(sql: string) {
  const { stdout } = await execFileAsync("vp", [
    "exec",
    "wrangler",
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    ".wrangler/e2e",
    "--json",
    "--command",
    sql,
  ]);
  const parsed: unknown = JSON.parse(stdout);
  return parsed;
}

test.beforeAll(async () => {
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
    "INSERT OR REPLACE INTO topic (id, difficulty, image_url) VALUES ('e2e-topic', 'easy', 'https://example.invalid/animic-topic.svg')",
  ]);
});

test("接続中の2人で開始し、開始時に切断していた人は復帰しても次の対戦を待つ", async ({
  page,
  browser,
}) => {
  const guestContext = await browser.newContext();
  const lateContext = await browser.newContext();
  try {
    for (const context of [page.context(), guestContext, lateContext]) {
      await context.route("https://example.invalid/animic-topic.svg", (route) =>
        route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/></svg>',
        }),
      );
    }
    await page.goto("/");
    await page.getByLabel("表示名").fill("開始担当");
    await page.getByRole("button", { name: "ルームを作る" }).click();
    await expect(page).toHaveURL(/\/rooms\/[A-Z2-9]{8}$/);
    await expect(page.getByRole("button", { name: "対戦を始める" })).toBeDisabled();
    const url = page.url();
    const guest = await guestContext.newPage();
    await guest.goto(url);
    await guest.getByLabel("表示名").fill("参加者");
    await guest.getByRole("button", { name: "ルームに参加", exact: true }).click();
    await expect(guest.getByRole("listitem")).toHaveCount(2);
    await expect(guest.getByRole("button", { name: "対戦を始める" })).toHaveCount(0);
    const late = await lateContext.newPage();
    await late.goto(url);
    await late.getByLabel("表示名").fill("待機参加者");
    await late.getByRole("button", { name: "ルームに参加", exact: true }).click();
    await expect(page.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "対戦を始める" })).toBeDisabled();
    await late.close();
    await expect(page.getByRole("listitem").filter({ hasText: "待機参加者" })).toContainText(
      "再接続待ち",
    );
    await expect(page.getByRole("button", { name: "対戦を始める" })).toBeEnabled();
    await page.getByLabel("制限時間（秒）").fill("120");
    await page.getByLabel("画像を選ぶ猶予（秒）").fill("60");
    await page.getByRole("button", { name: "対戦を始める" }).click();
    const timer = page.getByRole("timer", { name: "生成の残り時間" });
    await expect(timer).toBeVisible();
    const initialTime = await timer.textContent();
    await expect(timer).not.toHaveText(initialTime ?? "");
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("heading", { name: "今回のお題" })).toBeVisible();
      await expect(
        participant.getByRole("img", { name: "再現するお題のイラスト" }),
      ).toHaveAttribute("src", "https://example.invalid/animic-topic.svg");
    }
    await page.reload();
    await expect(page.getByRole("heading", { name: "今回のお題" })).toBeVisible();
    await expect(page.getByText("制限時間: 120秒", { exact: true })).toBeVisible();
    const returned = await lateContext.newPage();
    await returned.goto(url);
    await expect(returned.getByText("次の対戦を待っています。", { exact: true })).toBeVisible();
    await expect(returned.getByRole("img", { name: "再現するお題のイラスト" })).toHaveCount(0);
  } finally {
    await guestContext.close();
    await lateContext.close();
  }
});

test("勝負不成立後に再戦し、前の結果のD1保存も再試行する", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const guestContext = await browser.newContext();
  await queryLocalResults(
    "CREATE TRIGGER e2e_reject_result BEFORE INSERT ON battle_result BEGIN SELECT RAISE(FAIL, 'e2e storage failure'); END",
  );
  try {
    await page.goto("/");
    await page.getByLabel("表示名").fill("期限確認");
    await page.getByRole("button", { name: "ルームを作る" }).click();
    await expect(page).toHaveURL(/\/rooms\/[A-Z2-9]{8}$/);
    const guest = await guestContext.newPage();
    await guest.goto(page.url());
    await guest.getByLabel("表示名").fill("期限参加者");
    await guest.getByRole("button", { name: "ルームに参加", exact: true }).click();
    const code = v.parse(
      v.pipe(v.string(), v.regex(/^[A-Z2-9]{8}$/)),
      new URL(page.url()).pathname.split("/").at(-1),
    );
    await page.getByLabel("制限時間（秒）").fill("2");
    await page.getByLabel("画像を選ぶ猶予（秒）").fill("5");
    await expect(page.getByRole("button", { name: "対戦を始める" })).toBeEnabled();
    await page.getByRole("button", { name: "対戦を始める" }).click();
    await expect(
      page.getByText("生成時間が終了しました。提出する画像を選んでください。", { exact: true }),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("timer", { name: "提出までの残り時間" })).toBeVisible();
    await expect(page.getByRole("timer", { name: "生成の残り時間" })).toHaveCount(0);
    for (const participant of [page, guest]) {
      await expect(
        participant.getByText("提出期限を過ぎたため、未提出になりました。", { exact: true }),
      ).toBeVisible({ timeout: 8000 });
      await expect(
        participant.getByText("全員の提出受付が終了しました。", { exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByText("両者とも未提出のため、勝負不成立です。", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("timer")).toHaveCount(0);
    await page.getByLabel("制限時間（秒）").fill("120");
    await page.getByLabel("画像を選ぶ猶予（秒）").fill("10");
    await expect(guest.getByRole("button", { name: "次の対戦を始める", exact: true })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "次の対戦を始める", exact: true }).click();
    for (const participant of [page, guest]) {
      await expect(participant.getByText("制限時間: 120秒", { exact: true })).toBeVisible();
      await expect(participant.getByRole("heading", { name: "対戦結果", exact: true })).toHaveCount(
        0,
      );
      await expect(
        participant.getByText("生成した画像はありません。", { exact: true }),
      ).toBeVisible();
    }
    await queryLocalResults("DROP TRIGGER e2e_reject_result");
    const countSchema = v.array(v.object({ results: v.array(v.object({ count: v.number() })) }));
    await expect
      .poll(
        async () => {
          try {
            const data = v.parse(
              countSchema,
              await queryLocalResults(
                `SELECT count(*) AS count FROM battle_result WHERE room_code = '${code}' AND json_extract(data, '$.result.kind') = 'no-contest'`,
              ),
            );
            return data[0]?.results[0]?.count;
          } catch (error) {
            // previewと別プロセスのWranglerが同じローカルSQLiteを開くため、
            // 一時的なロックだけはpollの期限内で再試行する。
            if (error instanceof Error && error.message.includes("SQLITE_BUSY")) return undefined;
            throw error;
          }
        },
        { timeout: 45_000, intervals: [1000, 5000] },
      )
      .toBe(1);
    await page.reload();
    await expect(page.getByText("制限時間: 120秒", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "対戦結果", exact: true })).toHaveCount(0);
  } finally {
    await queryLocalResults("DROP TRIGGER IF EXISTS e2e_reject_result");
    await guestContext.close();
  }
});
