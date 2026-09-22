import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function create(page: Page, name = "ホスト") {
  await page.goto("/");
  await page.getByLabel("表示名").fill(name);
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  await expect(page.getByRole("status").filter({ hasText: "接続済み" })).toBeVisible();
  return page.url();
}

async function join(page: Page, url: string, name: string) {
  await page.goto(url);
  await page.getByLabel("表示名").fill(name);
  await page.getByRole("button", { name: "ルームに参加", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "接続済み" })).toBeVisible();
}

test("作成の同時要求と再送・招待・準備同期・複数タブ・ホストの退出", async ({
  page,
  context,
  browser,
}) => {
  let originalBody: string | null = null;
  let originalResponse: string | null = null;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const body = request.postData();
    if (request.method() !== "POST" || !body?.includes("requestId")) {
      await route.continue();
      return;
    }
    if (originalBody === null) {
      originalBody = body;
      const [first, duplicate] = await Promise.all([route.fetch(), route.fetch()]);
      expect(first.ok()).toBe(true);
      originalResponse = await first.text();
      expect(await duplicate.text()).toBe(originalResponse);
      await route.abort("failed");
    } else {
      expect(body).toBe(originalBody);
      const retried = await route.fetch();
      expect(await retried.text()).toBe(originalResponse);
      await route.fulfill({ response: retried });
    }
  });
  await page.goto("/");
  await page.getByLabel("表示名").fill("ホスト");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page.getByRole("alert")).toContainText("もう一度お試しください");
  await page.getByRole("button", { name: "ルームを作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem")).toContainText("ホスト");
  expect(originalResponse).toContain(new URL(page.url()).pathname.split("/").at(-1));
  await page.unrouteAll({ behavior: "wait" });
  const invite = page.url();
  await expect(page.getByRole("img", { name: "ルームへの招待QRコード" })).toBeVisible();
  await expect(page.getByRole("link", { name: invite })).toHaveAttribute("href", invite);
  const guestContext = await browser.newContext();
  try {
    const guest = await guestContext.newPage();
    await join(guest, invite.toLowerCase(), "ゲスト");
    await expect(guest).toHaveURL(invite);
    await expect(page.getByRole("listitem")).toHaveCount(2);
    await page.getByRole("button", { name: "準備完了", exact: true }).click();
    await expect(guest.getByRole("listitem").filter({ hasText: "ホスト" })).toContainText(
      "準備完了",
    );

    const secondTab = await context.newPage();
    await secondTab.goto(invite);
    await expect(secondTab.getByRole("button", { name: "準備完了を取り消す" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "準備完了を取り消す" })).toBeVisible();
    await secondTab.close();
    await expect(guest.getByRole("listitem").filter({ hasText: "ホスト" })).toContainText(
      "ホスト · 準備完了",
    );

    await page.getByRole("button", { name: "退出する" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:4173/");
    await expect(guest.getByRole("listitem")).toHaveCount(1);
    await expect(guest.getByRole("listitem")).toContainText("ホスト");
  } finally {
    await guestContext.close();
  }
});

test("切断したホストを30秒待って引き継ぎ、元ホストが戻っても戻さない", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(50_000);
  const invite = await create(page, "先発");
  const guestContext = await browser.newContext();
  try {
    const guest = await guestContext.newPage();
    await join(guest, invite, "後発");
    await page.close();
    const original = guest.getByRole("listitem").filter({ hasText: "先発" });
    const successor = guest.getByRole("listitem").filter({ hasText: "後発" });
    await expect(original).toContainText("再接続待ち");
    await expect(original).toContainText("ホスト");
    await expect(successor).toContainText("ホスト", { timeout: 35_000 });
    const restored = await context.newPage();
    await restored.goto(invite);
    await expect(restored.getByRole("status").filter({ hasText: "接続済み" })).toBeVisible();
    await expect(successor).toContainText("ホスト");
    await expect(original).not.toContainText("ホスト");
  } finally {
    await guestContext.close();
  }
});

test("WebSocketはOrigin・セッション・ルームへの参加を確認する", async ({ page, browser }) => {
  const invite = await create(page);
  const outsider = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  const connection = `${invite}/connection`;
  try {
    const wrongOrigin = await outsider.request.get(connection, {
      headers: { Origin: "https://untrusted.example" },
    });
    expect(wrongOrigin.status()).toBe(403);
    const anonymous = await outsider.request.get(connection, {
      headers: { Origin: "http://127.0.0.1:4173" },
    });
    expect(anonymous.status()).toBe(401);
    const signedIn = await outsider.request.post("/api/auth/sign-in/anonymous", {
      headers: { Origin: "http://127.0.0.1:4173" },
      data: {},
    });
    expect(signedIn.status()).toBe(200);
    const notMember = await outsider.request.get(connection, {
      headers: {
        Origin: "http://127.0.0.1:4173",
        Upgrade: "websocket",
        "X-Animic-Participant": "forged",
      },
    });
    expect(notMember.status()).toBe(403);
  } finally {
    await outsider.close();
  }
});

test("接続済みWebSocketもセッションの失効後に閉じる", async ({ page, context }) => {
  test.setTimeout(45_000);
  await create(page);
  const response = await context.request.post("/api/auth/sign-out", {
    headers: { Origin: "http://127.0.0.1:4173" },
    data: {},
  });
  expect(response.status()).toBe(200);
  await expect(
    page.getByRole("status").filter({ hasText: "セッションが失効しました" }),
  ).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("button", { name: "準備完了", exact: true })).toBeDisabled();
});
