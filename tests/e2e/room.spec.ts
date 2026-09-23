import { expect, test } from "@playwright/test";

import { connect, create, join, loadApi, snapshot } from "./api";

const origin = "http://127.0.0.1:4173";

test("作成の同時要求と再送・招待・準備同期・複数タブ・ホストの退出", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(45_000);
  await loadApi(page);
  const code = await page.evaluate(async () => {
    const api = window.animicTest;
    await api.ensureParticipant();
    const data = { name: "ホスト", requestId: crypto.randomUUID() };
    const codes = await Promise.all([api.createRoom({ data }), api.createRoom({ data })]);
    const retried = await api.createRoom({ data });
    if (codes[0] !== codes[1] || codes[0] !== retried) throw new Error("作成が重複しています。");
    return retried;
  });
  await connect(page, code);
  await expect.poll(async () => (await snapshot(page)).members.length).toBe(1);
  const hostId = (await snapshot(page)).hostId;
  expect(hostId).toBeTruthy();
  const entry = await page.evaluate(
    (value) => window.animicTest.getRoomEntry({ data: { code: value } }),
    code,
  );
  expect(entry.inviteUrl).toBe(`${origin}/rooms/${code}`);
  const guestContext = await browser.newContext();
  try {
    const guest = await guestContext.newPage();
    await join(guest, code.toLowerCase(), "ゲスト");
    await expect.poll(async () => (await snapshot(page)).members.length).toBe(2);
    await page.evaluate(
      (value) => window.animicTest.setReady({ data: { code: value, ready: true } }),
      code,
    );
    await expect
      .poll(
        async () => (await snapshot(guest)).members.find((member) => member.id === hostId)?.ready,
      )
      .toBe(true);

    const secondTab = await context.newPage();
    await loadApi(secondTab);
    await connect(secondTab, code);
    expect((await snapshot(secondTab)).members.find((member) => member.id === hostId)?.ready).toBe(
      true,
    );
    await loadApi(page);
    await connect(page, code);
    expect((await snapshot(page)).members.length).toBe(2);
    expect((await snapshot(page)).members.find((member) => member.id === hostId)?.ready).toBe(true);
    await secondTab.close();
    await expect
      .poll(
        async () =>
          (await snapshot(guest)).members.find((member) => member.id === hostId)?.connected,
      )
      .toBe(true);

    await page.evaluate((value) => window.animicTest.leaveRoom({ data: { code: value } }), code);
    await expect.poll(async () => (await snapshot(guest)).members.length).toBe(1);
    const remaining = await snapshot(guest);
    expect(remaining.hostId).toBe(remaining.members[0]?.id);
    expect(remaining.hostId).not.toBe(hostId);
    await expect
      .poll(() => page.evaluate(() => window.animicTest.connection()), { timeout: 35_000 })
      .toBe("ルームから退出しました。");
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
  const code = await create(page, "先発");
  const hostId = (await snapshot(page)).hostId;
  const guestContext = await browser.newContext();
  try {
    const guest = await guestContext.newPage();
    await join(guest, code, "後発");
    const guestId = await guest.evaluate(
      async () => (await window.animicTest.getCurrentParticipant())?.id,
    );
    await page.close();
    await expect
      .poll(
        async () =>
          (await snapshot(guest)).members.find((member) => member.id === hostId)?.connected,
      )
      .toBe(false);
    expect((await snapshot(guest)).hostId).toBe(hostId);
    await expect
      .poll(async () => (await snapshot(guest)).hostId, { timeout: 35_000 })
      .toBe(guestId);
    const restored = await context.newPage();
    await loadApi(restored);
    await connect(restored, code);
    await expect
      .poll(
        async () =>
          (await snapshot(guest)).members.find((member) => member.id === hostId)?.connected,
      )
      .toBe(true);
    expect((await snapshot(guest)).hostId).toBe(guestId);
  } finally {
    await guestContext.close();
  }
});

test("WebSocketはOrigin・セッション・ルームへの参加を確認する", async ({ page, browser }) => {
  const code = await create(page);
  const outsider = await browser.newContext({ baseURL: origin });
  const connection = `${origin}/rooms/${code}/connection`;
  try {
    const wrongOrigin = await outsider.request.get(connection, {
      headers: { Origin: "https://untrusted.example" },
    });
    expect(wrongOrigin.status()).toBe(403);
    const anonymous = await outsider.request.get(connection, {
      headers: { Origin: origin },
    });
    expect(anonymous.status()).toBe(401);
    const signedIn = await outsider.request.post("/api/auth/sign-in/anonymous", {
      headers: { Origin: origin },
      data: {},
    });
    expect(signedIn.status()).toBe(200);
    const notMember = await outsider.request.get(connection, {
      headers: { Origin: origin, Upgrade: "websocket", "X-Animic-Participant": "forged" },
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
    headers: { Origin: origin },
    data: {},
  });
  expect(response.status()).toBe(200);
  await expect
    .poll(() => page.evaluate(() => window.animicTest.connection()), { timeout: 35_000 })
    .toContain("セッションが失効しました");
});
